from flask import Flask, jsonify, request
import logging
import os
import random
import time

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format='[pagos] %(message)s')
logger = logging.getLogger('pagos')

FAIL_MODE = os.environ.get('FAIL_MODE', 'always').lower()
FAIL_RATE = float(os.environ.get('FAIL_RATE', '0.8'))

@app.route('/pagos', methods=['POST', 'GET'])
def procesar_pago():
    logger.info('Petición entrante a /pagos')
    start = time.time()
    if FAIL_MODE == 'always':
        logger.info('Simulación de fallo activo - retorno 503')
        return jsonify({'error': 'Servicio de pagos no disponible'}), 503

    if FAIL_MODE == 'random' and random.random() < FAIL_RATE:
        logger.info('Fallo aleatorio detectado - retorno 503')
        return jsonify({'error': 'Error en pagos'}, 503)

    elapsed = time.time() - start
    logger.info(f'Respuesta OK - tiempo: {elapsed:.2f}s')
    return jsonify({'status': 'ok', 'service': 'pagos', 'message': 'Pago procesado'})

@app.route('/health')
def health():
    logger.info('Health check solicitado')
    return jsonify({'status': 'ok', 'service': 'pagos'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
