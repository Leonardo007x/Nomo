from flask import Flask, jsonify
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format='[inventario] %(message)s')
logger = logging.getLogger('inventario')

@app.route('/inventario')
def obtener_inventario():
    logger.info('Petición entrante a /inventario')
    data = {
        'inventario': [
            {'producto': 'laptop', 'stock': 4, 'ubicacion': 'A-12'},
            {'producto': 'auriculares', 'stock': 28, 'ubicacion': 'B-03'},
            {'producto': 'raton inalambrico', 'stock': 15, 'ubicacion': 'B-07'}
        ]
    }
    logger.info('Respuesta OK - /inventario')
    return jsonify(data)

@app.route('/health')
def health():
    logger.info('Health check solicitado')
    return jsonify({'status': 'ok', 'service': 'inventario'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
