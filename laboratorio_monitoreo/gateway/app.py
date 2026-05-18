from flask import Flask, jsonify, request
import logging
import requests
import time
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format='[gateway] %(message)s')
logger = logging.getLogger('gateway')

SERVICE_ENDPOINTS = {
    'pedidos': 'http://pedidos:5000',
    'inventario': 'http://inventario:5000',
    'pagos': 'http://pagos:5000'
}

circuit_state = {}
metrics = {}
for service in SERVICE_ENDPOINTS:
    circuit_state[service] = {
        'fail_count': 0,
        'circuit_open': False,
        'opened_at': None
    }
    metrics[service] = {
        'requests': 0,
        'errors': 0,
        'total_response_time': 0.0
    }
MAX_FAILS = 3
COOLDOWN_SECONDS = 10
TIMEOUT_SECONDS = 3


def log_monitoring_status(status):
    logger.info(f'[monitoreo] Estado de servicios: {status}')


def record_metric(name, elapsed, is_error):
    m = metrics[name]
    m['requests'] += 1
    m['total_response_time'] += elapsed
    if is_error:
        m['errors'] += 1


def call_service(name, path, method='GET', json_data=None):
    url = f"{SERVICE_ENDPOINTS[name]}{path}"
    logger.info(f'[{name}] Petición entrante a {path}')
    if is_circuit_open(name):
        logger.info(f'[{name}] Circuito abierto - respuesta rápida 503')
        record_metric(name, 0.0, True)
        return None, {'error': 'Servicio no disponible'}, 503

    try:
        start = time.time()
        if method == 'GET':
            response = requests.get(url, timeout=TIMEOUT_SECONDS)
        else:
            response = requests.post(url, json=json_data, timeout=TIMEOUT_SECONDS)

        elapsed = time.time() - start
        if response.status_code == 200:
            logger.info(f'[{name}] Respuesta OK - tiempo: {elapsed:.2f}s')
            record_metric(name, elapsed, False)
            reset_circuit(name)
            return response.json(), None, response.status_code

        logger.info(f'[{name}] Error HTTP {response.status_code} - tiempo: {elapsed:.2f}s')
        record_metric(name, elapsed, True)
        record_failure(name)
        return None, response.json(), response.status_code

    except requests.exceptions.RequestException as ex:
        elapsed = time.time() - start
        logger.info(f'[{name}] Fallo numero {circuit_state[name]["fail_count"] + 1} de {MAX_FAILS}: {type(ex).__name__} - tiempo: {elapsed:.2f}s')
        record_metric(name, elapsed, True)
        record_failure(name)
        return None, {'error': 'Servicio no disponible'}, 503


def is_circuit_open(name):
    state = circuit_state[name]
    if not state['circuit_open']:
        return False
    if state['opened_at'] and datetime.now(timezone.utc) - state['opened_at'] > timedelta(seconds=COOLDOWN_SECONDS):
        logger.info(f'[{name}] Circuito en modo semi-abierto - intentando recuperación')
        return False
    return True


def record_failure(name):
    state = circuit_state[name]
    state['fail_count'] += 1
    if state['fail_count'] >= MAX_FAILS:
        if not state['circuit_open']:
            state['circuit_open'] = True
            state['opened_at'] = datetime.now(timezone.utc)
            logger.info(f'[{name}] Fallo numero {state["fail_count"]} de {MAX_FAILS} → circuito abierto')


def reset_circuit(name):
    state = circuit_state[name]
    if state['circuit_open']:
        state['circuit_open'] = False
        state['fail_count'] = 0
        state['opened_at'] = None
        logger.info(f'[{name}] Recuperación OK → circuito cerrado')


def check_service_health(name):
    url = f"{SERVICE_ENDPOINTS[name]}/health"
    result = {
        'status': 'down',
        'response_time': None
    }
    try:
        start = time.time()
        response = requests.get(url, timeout=TIMEOUT_SECONDS)
        elapsed = time.time() - start
        result['response_time'] = round(elapsed, 2)
        if response.status_code == 200:
            result['status'] = 'ok'
        return result
    except requests.exceptions.RequestException:
        result['response_time'] = round(TIMEOUT_SECONDS, 2)
        return result


@app.route('/pedidos')
def proxy_pedidos():
    data, error, status = call_service('pedidos', '/pedidos')
    if error:
        return jsonify(error), status
    return jsonify(data)


@app.route('/inventario')
def proxy_inventario():
    data, error, status = call_service('inventario', '/inventario')
    if error:
        return jsonify(error), status
    return jsonify(data)


@app.route('/pagos', methods=['POST', 'GET'])
def proxy_pagos():
    payload = request.get_json() if request.is_json else None
    data, error, status = call_service('pagos', '/pagos', method='POST' if request.method == 'POST' else 'GET', json_data=payload)
    if error:
        return jsonify(error), status
    return jsonify(data)


@app.route('/estado/pedidos')
def estado_pedidos():
    try:
        response = requests.get(f"{SERVICE_ENDPOINTS['pedidos']}/health", timeout=TIMEOUT_SECONDS)
        return jsonify(response.json())
    except requests.exceptions.RequestException:
        return jsonify({'status': 'down'}, 503)


@app.route('/estado/inventario')
def estado_inventario():
    try:
        response = requests.get(f"{SERVICE_ENDPOINTS['inventario']}/health", timeout=TIMEOUT_SECONDS)
        return jsonify(response.json())
    except requests.exceptions.RequestException:
        return jsonify({'status': 'down'}, 503)


@app.route('/estado/pagos')
def estado_pagos():
    try:
        response = requests.get(f"{SERVICE_ENDPOINTS['pagos']}/health", timeout=TIMEOUT_SECONDS)
        return jsonify(response.json())
    except requests.exceptions.RequestException:
        return jsonify({'status': 'down'}, 503)


@app.route('/monitoreo')
def monitoreo():
    report = {}
    total_errors = 0
    for service in SERVICE_ENDPOINTS:
        status = check_service_health(service)
        state = circuit_state[service]
        report[service] = {
            'health': status,
            'circuit_breaker': {
                'state': 'open' if state['circuit_open'] else 'closed',
                'fail_count': state['fail_count'],
                'opened_at': state['opened_at'].isoformat() if state['opened_at'] else None
            }
        }
        if status['status'] != 'ok':
            total_errors += 1
    report['summary'] = {
        'total_services': len(SERVICE_ENDPOINTS),
        'errors': total_errors,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    log_monitoring_status(report)
    return jsonify(report)


@app.route('/metricas')
def metricas():
    report = {}
    total_errors = 0
    for service in SERVICE_ENDPOINTS:
        m = metrics[service]
        avg_time = round(m['total_response_time'] / m['requests'], 2) if m['requests'] else 0
        report[service] = {
            'requests': m['requests'],
            'errors': m['errors'],
            'avg_response_time': avg_time
        }
        total_errors += m['errors']
    report['summary'] = {
        'total_requests': sum(metrics[s]['requests'] for s in SERVICE_ENDPOINTS),
        'total_errors': total_errors,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    logger.info(f'[metricas] Resumen: {report["summary"]}')
    return jsonify(report)


@app.route('/health')
def gateway_health():
    return jsonify({'status': 'ok', 'service': 'gateway'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
