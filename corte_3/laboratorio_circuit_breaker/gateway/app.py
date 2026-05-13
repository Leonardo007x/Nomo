from flask import Flask, request, jsonify
import requests
import time

app= Flask(__name__)

fallos_backend = 0
circuito_abierto_backend = False
fallos_usuarios = 0
circuito_abierto_usuarios = False
DEFAULT_TIMEOUT_SECONDS = 10
# Tras abrir el circuito, cada petición con circuito abierto espera este tiempo y hace UN intento;
# si responde OK → circuito cerrado; si falla → permanece abierto.
RECOVERY_WAIT_SECONDS = 5

def _intentar_recuperacion_usuarios():
    global fallos_usuarios, circuito_abierto_usuarios
    time.sleep(RECOVERY_WAIT_SECONDS)
    print(
        f"[usuarios] Espera controlada ({RECOVERY_WAIT_SECONDS}s): nuevo intento de conexión…",
        flush=True,
    )
    try:
        r = requests.get("http://usuarios:5000/usuarios", timeout=DEFAULT_TIMEOUT_SECONDS)
        if r.status_code == 200:
            circuito_abierto_usuarios = False
            fallos_usuarios = 0
            print("[usuarios] Recuperación OK → circuito cerrado.", flush=True)
            return r.json()
    except Exception as ex:
        print(f"[usuarios] Fallo en intento de recuperación: {ex}", flush=True)
    print("[usuarios] Recuperación fallida → circuito permanece abierto.", flush=True)
    return None

def _intentar_recuperacion_backend():
    global fallos_backend, circuito_abierto_backend
    time.sleep(RECOVERY_WAIT_SECONDS)
    print(
        f"[mascotas/backend] Espera controlada ({RECOVERY_WAIT_SECONDS}s): nuevo intento de conexión…",
        flush=True,
    )
    try:
        r = requests.get("http://backend:5000/mascotas", timeout=DEFAULT_TIMEOUT_SECONDS)
        if r.status_code == 200:
            circuito_abierto_backend = False
            fallos_backend = 0
            print("[mascotas/backend] Recuperación OK → circuito cerrado.", flush=True)
            return r.json()
    except Exception as ex:
        print(f"[mascotas/backend] Fallo en intento de recuperación: {ex}", flush=True)
    print("[mascotas/backend] Recuperación fallida → circuito permanece abierto.", flush=True)
    return None

@app.route("/usuarios")
def usuarios():
    global fallos_usuarios, circuito_abierto_usuarios
    if circuito_abierto_usuarios:
        data = _intentar_recuperacion_usuarios()
        if data is not None:
            return jsonify(data)
        return {"Error:": "Servicio temporalmente no disponible"}, 503
    try:
        response = requests.get("http://usuarios:5000/usuarios", timeout=10)
        fallos_usuarios = 0
        print(f"[LOG] /usuarios - Status: OK, Tiempo: {time.time() - inicio:.2f}s", flush=True)
        return jsonify(response.json())
    except:
        fallos_usuarios += 1
        print(f"Fallo numero {fallos_usuarios} de 3", flush=True)
        if fallos_usuarios >= 3:
            circuito_abierto_usuarios = True
            print("Circuito abierto", flush=True)
            print(f"[LOG] /usuarios - Status: FALLIDO, Tiempo: {time.time() - inicio:.2f}s", flush=True)
        return {"error": "Servicio no disponible"}, 503

@app.route("/mascotas")
def mascotas():
    global fallos_backend, circuito_abierto_backend
    if circuito_abierto_backend:
        data = _intentar_recuperacion_backend()
        if data is not None:
            return jsonify(data)
        return {"Error:": "Servicio temporalmente no disponible"}, 503
    try:
        inicio = time.time()
        print("[GATEWAY], Intentando conectar con backend…", flush=True)
        response = requests.get("http://backend:5000/mascotas", timeout=10)
        fallos_backend = 0
        fin = time.time()
        print(f"[INFO] tiempo de respuesta: {fin-inicio}", flush=True)
        print(f"[LOG] /mascotas - Status: OK, Tiempo: {time.time() - inicio:.2f}s", flush=True)
        return jsonify(response.json())

    except: 
        fallos_backend += 1
        print(f"Fallo numero {fallos_backend} de 3", flush=True)
        if fallos_backend >= 3:
            circuito_abierto_backend = True
            print("Circuito abierto", flush=True)
            print(f"[LOG] /mascotas - Status: FALLIDO, Tiempo: {time.time() - inicio:.2f}s", flush=True)
        return {"error": "Servicio no disponible"}, 503

@app.route("/mascotas/<int:mascota_id>")
def mascota_por_id(mascota_id: int):
    for i in range(3):
        try:
            response = requests.get("http://backend:5000/mascotas", timeout=10)
            if response.status_code != 200:
                return jsonify({"error": "Error en backend"}), response.status_code

            payload = response.json() or {}
            mascotas = payload.get("Mascotas")

            if not mascotas:
                return jsonify({"error": "No hay datos"}), 404

            # backend devuelve lista de tuplas: [ [id, nombre, tipo], ... ]
            for m in mascotas:
                try:
                    if int(m[0]) == mascota_id:
                        return jsonify({"id": m[0], "nombre": m[1], "tipo": m[2]})
                except (TypeError, ValueError, IndexError):
                    continue

            return jsonify({"error": "Mascota no encontrada"}), 404

        except requests.exceptions.Timeout:
            return jsonify({"error": "Tiempo de espera agotado"}), 503
        except requests.exceptions.ConnectionError:
            print(f"[GATEWAY], backend caído intento: {i+1}", flush=True)

    return jsonify({"error": "Servicio no responde"}), 504

@app.route("/resumen")
def resumen():
    global fallos_usuarios, circuito_abierto_usuarios, fallos_backend, circuito_abierto_backend

    msg_usuarios = "Servicio no disponible por parte de usuarios"
    msg_mascotas = "Servicio no disponible por parte de mascotas"
    payload = {}

    if circuito_abierto_usuarios:
        data_u = _intentar_recuperacion_usuarios()
        if data_u is not None:
            payload["usuarios"] = data_u
        else:
            payload["error_usuarios"] = msg_usuarios
    else:
        try:
            usuarios_resp = requests.get("http://usuarios:5000/usuarios", timeout=10)
            if usuarios_resp.status_code != 200:
                payload["error_usuarios"] = msg_usuarios
            else:
                fallos_usuarios = 0
                payload["usuarios"] = usuarios_resp.json()
        except:
            fallos_usuarios += 1
            print(f"Fallo numero {fallos_usuarios} de 3", flush=True)
            if fallos_usuarios >= 3:
                circuito_abierto_usuarios = True
                print("Circuito abierto", flush=True)
            payload["error_usuarios"] = msg_usuarios

    if circuito_abierto_backend:
        data_m = _intentar_recuperacion_backend()
        if data_m is not None:
            mascotas_payload = data_m or {}
            payload["mascotas"] = mascotas_payload.get("Mascotas", [])
        else:
            payload["error_mascotas"] = msg_mascotas
    else:
        try:
            mascotas_resp = requests.get("http://backend:5000/mascotas", timeout=10)
            if mascotas_resp.status_code != 200:
                payload["error_mascotas"] = msg_mascotas
            else:
                fallos_backend = 0
                mascotas_payload = mascotas_resp.json() or {}
                payload["mascotas"] = mascotas_payload.get("Mascotas", [])
        except:
            fallos_backend += 1
            print(f"Fallo numero {fallos_backend} de 3", flush=True)
            if fallos_backend >= 3:
                circuito_abierto_backend = True
                print("Circuito abierto", flush=True)
            payload["error_mascotas"] = msg_mascotas

    tiene_usuarios = "usuarios" in payload
    tiene_mascotas = "mascotas" in payload
    if not tiene_usuarios and not tiene_mascotas:
        return jsonify(payload), 503
    return jsonify(payload), 200

@app.route("/estado/backend")
def estado_backend():
    try: 
        response = requests.get("http://backend:5000/health", timeout=3)
        return jsonify(response.json())
    except:
        return jsonify({"status": "down"}, 503)
    

@app.route("/health")
def health():
    return {
        "status": "ok",
        "service": "gateway"
    }

@app.route("/estado/usuarios")
def estado_usuarios():
    try: 
        response = requests.get("http://usuarios:5000/health", timeout=3)
        return jsonify(response.json())
    except:
        return jsonify({"status": "down"}, 503)


@app.route("/estado/db")
def estado_db():
    try: 
        response = requests.get("http://backend:5000/estado/db", timeout=3)  # Asumiendo que agregas esto en backend
        return jsonify(response.json())
    except:
        return jsonify({"status": "down"}, 503)


@app.route("/monitoreo")
def monitoreo():
    import time
    resultados = {}
    servicios = [
        ("gateway", "http://gateway:5000/health"),
        ("backend", "http://backend:5000/health"),
        ("usuarios", "http://usuarios:5000/health"),
        ("db", "http://backend:5000/estado/db")
    ]
    for nombre, url in servicios:
        inicio = time.time()
        try:
            response = requests.get(url, timeout=3)
            fin = time.time()
            resultados[nombre] = {
                "status": response.json().get("status", "unknown"),
                "response_time": round(fin - inicio, 2)
            }
        except:
            fin = time.time()
            resultados[nombre] = {
                "status": "down",
                "response_time": round(fin - inicio, 2)
            }
    # Logs: imprime en consola para análisis
    print(f"[MONITOREO] Estado de servicios: {resultados}", flush=True)
    return jsonify(resultados)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)