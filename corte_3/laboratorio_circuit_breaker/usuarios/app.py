from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/usuarios")
def usuarios():
    return jsonify([
        {"id": 1, "nombre": "Ana"},
        {"id": 2, "nombre": "Luis"}
    ])

@app.route("/health")
def health():
    return {
        "status": "ok",
        "service": "usuarios"
    }

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)