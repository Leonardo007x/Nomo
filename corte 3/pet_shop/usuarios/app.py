from flask import Flask, request, jsonify
app=Flask(__name__)

usuarios_data = [
    {"id": 1, "nombre": "Juan"},
    {"id": 2, "nombre": "María"},
    {"id": 3, "nombre": "Pedro"},
    {"id": 4, "nombre": "lolo"},
    {"id": 5, "nombre": "matio"}
]

@app.route("/usuarios/<int:id>")
def usuario(id):
    user = next((u for u in usuarios_data if u['id'] == id), None)
    if user:
        return jsonify(user)
    else:
        return jsonify({"error": "Usuario no encontrado"}), 404

@app.route("/usuarios")
def usuarios():
    return jsonify(usuarios_data)

if __name__ == "__main__":    
    app.run(debug=True, host='0.0.0.0', port=5000)