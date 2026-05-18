from flask import Flask, jsonify
import logging
import time

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format='[pagos] %(message)s')
logger = logging.getLogger('pagos')

# Simulación de fallos integrada
_simulacion_activa = True
_contador_peticiones = 0
_FALLOS_CADA_N = 5  # falla 4 de cada 5 peticiones (~80%)


def debe_simular_fallo():
    global _contador_peticiones
    _contador_peticiones += 1
    if not _simulacion_activa:
        return False
    return _contador_peticiones % _FALLOS_CADA_N != 0


@app.route('/pagos', methods=['POST', 'GET'])
def procesar_pago():
    logger.info('Petición entrante a /pagos')
    start = time.time()
    if debe_simular_fallo():
        logger.info(
            f'Simulación de fallo activa (petición #{_contador_peticiones}) - retorno 503'
        )
        return jsonify({'error': 'Servicio de pagos no disponible'}), 503

    elapsed = time.time() - start
    logger.info(f'Respuesta OK - tiempo: {elapsed:.2f}s')
    return jsonify({
        'status': 'ok',
        'service': 'pagos',
        'mensaje': 'Pago autorizado',
        'id_transaccion': f'TXN-{int(time.time() * 1000) % 900000 + 100000}',
        'monto': 459.97,
        'moneda': 'USD',
        'metodo': 'tarjeta_simulada'
    })


@app.route('/health')
def health():
    logger.info('Health check solicitado')
    if _simulacion_activa:
        logger.info('Health check: servicio degradado (simulación activa)')
        return jsonify({
            'status': 'down',
            'service': 'pagos',
            'reason': 'simulacion_fallos_activa',
            'peticiones': _contador_peticiones
        }), 503
    return jsonify({'status': 'ok', 'service': 'pagos'})


@app.route('/control/simulacion', methods=['POST'])
def control_simulacion():
    global _simulacion_activa
    _simulacion_activa = not _simulacion_activa
    estado = 'activada' if _simulacion_activa else 'desactivada'
    logger.info(f'Simulación de fallos {estado}')
    return jsonify({
        'simulacion_activa': _simulacion_activa,
        'mensaje': f'Simulación {estado}'
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
