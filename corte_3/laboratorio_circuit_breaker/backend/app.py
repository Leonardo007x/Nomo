from flask import Flask, request, jsonify
import mysql.connector
import os
import time

import requests

app = Flask(__name__)

def get_connection():
    return mysql.connector.connect(
      host = os.getenv("DB_HOST"),
      user = os.getenv("DB_USER"),
      password = os.getenv("DB_PASSWORD"),
      database = os.getenv("DB_NAME")  
    )
@app.route("/relacion")
def relacion():
    connection = get_connection()
    cursor= connection.cursor()
    cursor.execute("SELECT nombre FROM mascotas")
    mascota = cursor.fetchall()
    connection.close()
    usuarios= requests.get("http://usuarios:5000/usuarios").json()

    nombre_usuario= usuarios[0]["nombre"] if usuarios else "Sin usuario"
    nombre_mascota = mascota[0] if mascota else "Sin mascota"
    return {
        "usuario": nombre_usuario,
        "mascota": nombre_mascota
    }

@app.route("/")
def home():
    return "API FUNCIONANDO"

@app.route("/mascotas", methods= ["POST"])
def crear_mascota():
    data= request.json
    conection = get_connection()
    cursor = conection.cursor()
    cursor.execute(
        "INSERT INTO mascotas (nombre, tipo), VALUES (%s, %s)",
        (data["nombre"], data["tipo"])
    )
    conection.commit()
    conection.close()
    return {"mensaje": "Mascota creada"}

@app.route("/mascotas", methods=["GET"])
def obtener_mascotas():
    conection= get_connection()
    cursor= conection.cursor()
    cursor.execute("SELECT * FROM mascotas")
    mascotas= cursor.fetchall()
    conection.close()
    return jsonify({"Mascotas": mascotas})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port= 5000, debug=True)

