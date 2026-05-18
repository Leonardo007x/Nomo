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
            {'id': 101, 'item': 'laptop', 'cantidad': 1, 'cliente': 'Ana Ruiz'},
            {'id': 102, 'item': 'auriculares', 'cantidad': 3, 'cliente': 'Luis Mora'},
            {'id': 103, 'item': 'raton inalambrico', 'cantidad': 2, 'cliente': 'Ana Ruiz'}
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
