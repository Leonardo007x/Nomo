from flask import Flask, jsonify
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format='[pedidos] %(message)s')
logger = logging.getLogger('pedidos')

@app.route('/pedidos')
def obtener_pedidos():
    logger.info('Petición entrante a /pedidos')
    data = {
        'pedidos': [
            {'id': 1, 'item': 'camisa', 'cantidad': 2},
            {'id': 2, 'item': 'zapatos', 'cantidad': 1}
        ]
    }
    logger.info('Respuesta OK - /pedidos')
    return jsonify(data)

@app.route('/health')
def health():
    logger.info('Health check solicitado')
    return jsonify({'status': 'ok', 'service': 'pedidos'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
