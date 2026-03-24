from flask import Flask, jsonify
from flask_cors import CORS
import os
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False  # Permite ñ, á, etc. en las respuestas JSON
CORS(app)  # Permite peticiones desde el frontend (localhost:8080)

def obtener_conexion():
    """Intenta conectar a MySQL usando variables de entorno."""
    try:
        return mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'leen_user'),
            password=os.getenv('MYSQL_PASSWORD', 'leen_password'),
            database=os.getenv('MYSQL_DATABASE', 'leen_db'),
            charset='utf8mb4'
        )
    except Error as e:
        return None

@app.route('/api/estado')
def estado():
    """Endpoint de salud - verifica si la API está activa."""
    return jsonify({
        'mensaje': 'Leen API funcionando',
        'servicio': 'backend'
    })

@app.route('/api/libros')
def libros():
    """Lista libros desde la base de datos (si está conectada)."""
    conn = obtener_conexion()
    if conn is None:
        return jsonify({
            'error': 'No se pudo conectar a la base de datos',
            'libros': []
        }), 503
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, titulo, autor FROM libros")
        libros = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'libros': libros})
    except Error as e:
        return jsonify({
            'error': str(e),
            'libros': []
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
