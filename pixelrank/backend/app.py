from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
CORS(app)

def get_conn():
    try:
        return mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'pixelrank_user'),
            password=os.getenv('MYSQL_PASSWORD', 'pixelrank_pass'),
            database=os.getenv('MYSQL_DATABASE', 'pixelrank_db'),
            charset='utf8mb4'
        )
    except Error:
        return None

# ------------------------------------------------------------------
# GET /api/ping  — health check
# ------------------------------------------------------------------
@app.route('/api/ping')
def ping():
    return jsonify({'status': 'ok', 'app': 'PixelRank'})

# ------------------------------------------------------------------
# GET /api/juegos?genero=RPG  — todos los juegos (filtro opcional)
# ------------------------------------------------------------------
@app.route('/api/juegos')
def juegos():
    genero = request.args.get('genero')
    conn = get_conn()
    if conn is None:
        return jsonify({'error': 'Sin conexión a la base de datos', 'juegos': []}), 503
    try:
        cursor = conn.cursor(dictionary=True)
        if genero:
            cursor.execute(
                "SELECT * FROM juegos WHERE genero = %s ORDER BY puntuacion DESC",
                (genero,)
            )
        else:
            cursor.execute("SELECT * FROM juegos ORDER BY puntuacion DESC")
        resultado = cursor.fetchall()
        cursor.close(); conn.close()
        return jsonify({'juegos': resultado, 'total': len(resultado)})
    except Error as e:
        return jsonify({'error': str(e), 'juegos': []}), 500

# ------------------------------------------------------------------
# GET /api/top  — juegos con puntuacion >= 9.3
# ------------------------------------------------------------------
@app.route('/api/top')
def top():
    conn = get_conn()
    if conn is None:
        return jsonify({'error': 'Sin conexión a la base de datos', 'juegos': []}), 503
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM juegos WHERE puntuacion >= 9.3 ORDER BY puntuacion DESC"
        )
        resultado = cursor.fetchall()
        cursor.close(); conn.close()
        return jsonify({'juegos': resultado})
    except Error as e:
        return jsonify({'error': str(e), 'juegos': []}), 500

# ------------------------------------------------------------------
# GET /api/generos  — lista de géneros únicos disponibles
# ------------------------------------------------------------------
@app.route('/api/generos')
def generos():
    conn = get_conn()
    if conn is None:
        return jsonify({'error': 'Sin conexión a la base de datos', 'generos': []}), 503
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT genero FROM juegos ORDER BY genero")
        resultado = [row[0] for row in cursor.fetchall()]
        cursor.close(); conn.close()
        return jsonify({'generos': resultado})
    except Error as e:
        return jsonify({'error': str(e), 'generos': []}), 500

# ------------------------------------------------------------------
# GET /api/stats  — estadísticas generales del catálogo
# ------------------------------------------------------------------
@app.route('/api/stats')
def stats():
    conn = get_conn()
    if conn is None:
        return jsonify({'error': 'Sin conexión a la base de datos'}), 503
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                COUNT(*)            AS total,
                ROUND(AVG(puntuacion), 2) AS promedio,
                MAX(puntuacion)     AS maxima,
                COUNT(DISTINCT genero) AS generos
            FROM juegos
        """)
        resultado = cursor.fetchone()
        cursor.close(); conn.close()
        return jsonify(resultado)
    except Error as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
