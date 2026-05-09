from flask import Flask, request, jsonify
import mysql.connector
import os
import requests

import logging

app = Flask(__name__)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] [BACKEND] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Desactivar logs ruidosos de Werkzeug (Flask)
logging.getLogger('werkzeug').setLevel(logging.ERROR)

@app.before_request
def log_request_info():
    logger.info(f"Petición recibida: {request.method} {request.path}")

def get_connection():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'mydatabase')
    )

@app.route("/relacion")
def relacion():
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT id, nombre_mascota, user_id FROM mascotas WHERE user_id IS NOT NULL")
    mascotas = cursor.fetchall()
    connection.close()
    
    relaciones = []
    for mascota in mascotas:
        try:
            user_response = requests.get(f'http://usuarios:5000/usuarios/{mascota[2]}')
            if user_response.status_code == 200:
                user = user_response.json()
            else:
                user = {"error": "Usuario no encontrado"}
        except Exception as e:
            user = {"error": f"Error al consultar usuario: {str(e)}"}
        
        relaciones.append({
            "mascota": {
                "id": mascota[0],
                "nombre": mascota[1],
                "user_id": mascota[2]
            },
            "usuario": user
        })
    
    return {
        "relaciones": relaciones,
        "total": len(relaciones),
        "mensaje": "Relaciones entre usuarios y mascotas"
    }



@app.route('/')
def home():
    return "api funcionando"

@app.route('/mascotas', methods=['POST'])
def crear_mascota():
    data = request.get_json()
    if not all(key in data for key in ['nombre', 'user_id']):
        return {"error": "Faltan campos requeridos: nombre, user_id"}, 400
    
    try:    
        user_response = requests.get(f'http://usuarios:5000/usuarios/{data["user_id"]}')
        if user_response.status_code != 200:
            return {"error": "Usuario no encontrado"}, 404
    except:
        return {"error": "Error al verificar usuario"}, 500
    
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("INSERT INTO mascotas (nombre_mascota, user_id) VALUES (%s, %s)", 
    (data['nombre'], data['user_id']))
    connection.commit()
    connection.close()
    return{"mensaje": "Mascota creada exitosamente"}

@app.route('/mascotas', methods=['GET'])
def obtener_mascotas():
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT id, nombre_mascota, user_id FROM mascotas")
    mascotas = cursor.fetchall()
    connection.close()
    return jsonify(mascotas)

@app.route('/mascotas/<int:mascota_id>/usuario', methods=['GET'])
def obtener_usuario_mascota(mascota_id):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT id, nombre_mascota, user_id FROM mascotas WHERE id = %s", (mascota_id,))
    mascota = cursor.fetchone()
    connection.close()
    
    if not mascota:
        return {"error": "Mascota no encontrada"}, 404
    
    if mascota[2] is None:
        return {
            "mascota": {
                "id": mascota[0],
                "nombre": mascota[1]
            },
            "usuario": None,
            "mensaje": "Esta mascota no tiene usuario asignado"
        }
    
    try:
        user_response = requests.get(f'http://usuarios:5000/usuarios/{mascota[2]}')
        if user_response.status_code != 200:
            return {"error": "Usuario no encontrado"}, 404
        user = user_response.json()
    except:
        return {"error": "Error al consultar usuario"}, 500
    
    return {
        "mascota": {
            "id": mascota[0],
            "nombre": mascota[1]
        },
        "usuario": user
    }

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)