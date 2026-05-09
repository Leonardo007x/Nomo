from flask import Flask, request, jsonify
import requests
import logging
import time

app = Flask(__name__)

CIRCUIT_CLOSED = "closed"
CIRCUIT_OPEN = "open"
CIRCUIT_HALF_OPEN = "half-open"

# Variables Globales de Estado para Backend
estado_backend = CIRCUIT_CLOSED
fallos_backend = 0
umbral_backend = 3
tiempo_apertura_backend = None

# Variables Globales de Estado para Usuarios
estado_usuarios = CIRCUIT_CLOSED
fallos_usuarios = 0
umbral_usuarios = 3
tiempo_apertura_usuarios = None

TIMEOUT_RECUPERACION = 10

# Use Flask app logger so custom logs se integren con la salida de Flask/werkzeug
app.logger.setLevel(logging.INFO)
logger = app.logger

# Dejar los logs de werkzeug en INFO para preservar la salida estándar de Flask
logging.getLogger('werkzeug').setLevel(logging.INFO)

def get_service_state(service):
    """Retorna el estado actual de un servicio para el log."""
    if service == "backend":
        return estado_backend.upper()
    if service == "usuarios":
        return estado_usuarios.upper()
    return "UNKNOWN"

def log_request(endpoint, method, start_time, service=None, status_code=None, error=None):
    """Función para registrar logs de las peticiones con estado del sistema"""
    duration = time.time() - start_time
    state = get_service_state(service) if service else "GATEWAY"
    
    if error:
        logger.error(f" [ERROR] [{state}] [{method}] {endpoint} - {error} - ({duration:.2f}s)")
    else:
        # Si es funcional (CLOSED), usamos un tag específico para facilitar el filtrado
        if state == "CLOSED":
            logger.info(f" [HEALTHY] [{method}] {endpoint} - Status: {status_code} - ({duration:.2f}s)")
        elif state == "HALF-OPEN":
            logger.info(f" [HALF-OPEN] [{method}] {endpoint} - Status: {status_code} - ({duration:.2f}s)")
        else:
            logger.info(f" [{state}] [{method}] {endpoint} - Status: {status_code} - ({duration:.2f}s)")

def make_request(url, service, timeout=5):
    """Función auxiliar para hacer peticiones con manejo de errores"""
    try:
        start_time = time.time()
        response = requests.get(url, timeout=timeout)
        log_request(url, "GET", start_time, service=service, status_code=response.status_code)
        return response
    except requests.exceptions.Timeout:
        log_request(url, "GET", start_time, service=service, error="Timeout")
        return None
    except requests.exceptions.ConnectionError:
        log_request(url, "GET", start_time, service=service, error="Connection Error")
        return None
    except Exception as e:
        log_request(url, "GET", start_time, service=service, error=str(e))
        return None

@app.route("/usuarios")
def usuarios():
    global estado_usuarios, fallos_usuarios, tiempo_apertura_usuarios
    start_time = time.time()
    url = "http://usuarios:5000/usuarios"

    # 1. Lógica de Recuperación (Check Recovery Timeout)
    if estado_usuarios == CIRCUIT_OPEN:
        tiempo_desde_apertura = time.time() - tiempo_apertura_usuarios
        if tiempo_desde_apertura >= TIMEOUT_RECUPERACION:
            logger.warning(f" [RECOVERY_START] Intentando recuperación de USUARIOS después de {tiempo_desde_apertura:.1f}s")
            estado_usuarios = CIRCUIT_HALF_OPEN
    
    # 2. Verificar si el circuito está abierto
    if estado_usuarios == CIRCUIT_OPEN:
        logger.warning(f" [CIRCUIT_OPEN] USUARIOS: Petición rechazada preventivamente")
        return jsonify({"error": "Servicio de usuarios no disponible", "servicio": "usuarios"}), 503

    # 3. Intentar la petición
    try:
        response = requests.get(url, timeout=2)
        
        # Si fue exitosa
        if estado_usuarios == CIRCUIT_HALF_OPEN:
            logger.info("="*60)
            logger.info(f" [RECOVERY_SUCCESS] USUARIOS: Servicio recuperado. Circuito CERRADO")
            logger.info(" [SYSTEM STATUS] El sistema vuelve a estar 100% FUNCIONAL")
            logger.info("="*60)
            estado_usuarios = CIRCUIT_CLOSED
            fallos_usuarios = 0
        else:
            fallos_usuarios = 0
        
        log_request(url, "GET", start_time, service="usuarios", status_code=response.status_code)
        
        if not response.json():
            return jsonify({"error": "No hay usuarios disponibles", "servicio": "usuarios"}), 404
            
        return jsonify(response.json())

    except Exception as e:
        fallos_usuarios += 1
        logger.error(f" [FALLO {fallos_usuarios}/{umbral_usuarios}] USUARIOS: {str(e)}")
        
        if estado_usuarios == CIRCUIT_HALF_OPEN:
            logger.critical(f" [RECOVERY_FAILED] USUARIOS: Reintentos fallidos, Circuito REABIERTO")
            estado_usuarios = CIRCUIT_OPEN
            tiempo_apertura_usuarios = time.time()
            fallos_usuarios = 0
        elif fallos_usuarios >= umbral_usuarios:
            logger.critical(f" [CIRCUIT_OPEN] USUARIOS: Umbral de fallos alcanzado. Circuito ABIERTO")
            estado_usuarios = CIRCUIT_OPEN
            tiempo_apertura_usuarios = time.time()
        
        return jsonify({"error": "Servicio de usuarios no disponible", "servicio": "usuarios"}), 503

@app.route("/mascotas")
def mascotas():
    global estado_backend, fallos_backend, tiempo_apertura_backend
    start_time = time.time()
    url = "http://backend:5000/mascotas"

    # 1. Lógica de Recuperación
    if estado_backend == CIRCUIT_OPEN:
        tiempo_desde_apertura = time.time() - tiempo_apertura_backend
        if tiempo_desde_apertura >= TIMEOUT_RECUPERACION:
            logger.warning(f" [RECOVERY_START] Intentando recuperación de BACKEND después de {tiempo_desde_apertura:.1f}s")
            estado_backend = CIRCUIT_HALF_OPEN
    
    # 2. Verificar si el circuito está abierto
    if estado_backend == CIRCUIT_OPEN:
        logger.warning(f" [CIRCUIT_OPEN] BACKEND: Petición rechazada preventivamente")
        return jsonify({"error": "Servicio de mascotas no disponible", "servicio": "backend"}), 503

    # 3. Intentar la petición
    try:
        response = requests.get(url, timeout=2)
        
        if estado_backend == CIRCUIT_HALF_OPEN:
            logger.info("="*60)
            logger.info(f" [RECOVERY_SUCCESS] BACKEND: Servicio recuperado. Circuito CERRADO")
            logger.info(" [SYSTEM STATUS] El sistema vuelve a estar 100% FUNCIONAL")
            logger.info("="*60)
            estado_backend = CIRCUIT_CLOSED
            fallos_backend = 0
        else:
            fallos_backend = 0
        
        log_request(url, "GET", start_time, service="backend", status_code=response.status_code)
        return jsonify(response.json())

    except Exception as e:
        fallos_backend += 1
        logger.error(f" [FALLO {fallos_backend}/{umbral_backend}] BACKEND: {str(e)}")
        
        if estado_backend == CIRCUIT_HALF_OPEN:
            logger.critical(f" [RECOVERY_FAILED] BACKEND: Reintentos fallidos, Circuito REABIERTO")
            estado_backend = CIRCUIT_OPEN
            tiempo_apertura_backend = time.time()
            fallos_backend = 0
        elif fallos_backend >= umbral_backend:
            logger.critical(f" [CIRCUIT_OPEN] BACKEND: Umbral de fallos alcanzado. Circuito ABIERTO")
            estado_backend = CIRCUIT_OPEN
            tiempo_apertura_backend = time.time()
        
        return jsonify({"error": "Servicio de mascotas no disponible", "servicio": "backend"}), 503

@app.route("/mascotas/<int:mascota_id>")
def mascota_por_id(mascota_id):
    global estado_backend, fallos_backend, tiempo_apertura_backend
    start_time = time.time()
    url = f"http://backend:5000/mascotas/{mascota_id}/usuario"

    # 1. Lógica de Recuperación
    if estado_backend == CIRCUIT_OPEN:
        tiempo_desde_apertura = time.time() - tiempo_apertura_backend
        if tiempo_desde_apertura >= TIMEOUT_RECUPERACION:
            logger.warning(f" [RECOVERY_START] Intentando recuperación de BACKEND después de {tiempo_desde_apertura:.1f}s")
            estado_backend = CIRCUIT_HALF_OPEN
    
    # 2. Verificar si el circuito está abierto
    if estado_backend == CIRCUIT_OPEN:
        logger.warning(f" [CIRCUIT_OPEN] BACKEND: Petición rechazada preventivamente")
        return jsonify({"error": "Servicio de mascotas no disponible", "servicio": "backend"}), 503

    # 3. Intentar la petición
    try:
        response = requests.get(url, timeout=2)
        
        if estado_backend == CIRCUIT_HALF_OPEN:
            logger.info("="*60)
            logger.info(f" [RECOVERY_SUCCESS] BACKEND: Servicio recuperado. Circuito CERRADO")
            logger.info(" [SYSTEM STATUS] El sistema vuelve a estar 100% FUNCIONAL")
            logger.info("="*60)
            estado_backend = CIRCUIT_CLOSED
            fallos_backend = 0
        else:
            fallos_backend = 0
        
        log_request(url, "GET", start_time, service="backend", status_code=response.status_code)
        
        if response.status_code == 404:
            return jsonify({"error": "Mascota no encontrada", "id": mascota_id}), 404
            
        return jsonify(response.json())

    except Exception as e:
        fallos_backend += 1
        logger.error(f" [FALLO {fallos_backend}/{umbral_backend}] BACKEND: {str(e)}")
        
        if estado_backend == CIRCUIT_HALF_OPEN:
            logger.critical(f" [RECOVERY_FAILED] BACKEND: Reintentos fallidos, Circuito REABIERTO")
            estado_backend = CIRCUIT_OPEN
            tiempo_apertura_backend = time.time()
            fallos_backend = 0
        elif fallos_backend >= umbral_backend:
            logger.critical(f" [CIRCUIT_OPEN] BACKEND: Umbral de fallos alcanzado. Circuito ABIERTO")
            estado_backend = CIRCUIT_OPEN
            tiempo_apertura_backend = time.time()
        
        return jsonify({"error": "Servicio de mascotas no disponible", "servicio": "backend"}), 503

@app.route("/resumen")
def resumen():
    global estado_usuarios, fallos_usuarios, tiempo_apertura_usuarios
    global estado_backend, fallos_backend, tiempo_apertura_backend
    start_time = time.time()

    # --- Lógica para USUARIOS ---
    if estado_usuarios == CIRCUIT_OPEN:
        if (time.time() - tiempo_apertura_usuarios) >= TIMEOUT_RECUPERACION:
            estado_usuarios = CIRCUIT_HALF_OPEN
            logger.warning(f" [RECOVERY_START] Intentando recuperación de USUARIOS")

    usuarios_data = {"error": "No se pudieron obtener los usuarios"}
    if estado_usuarios != CIRCUIT_OPEN:
        try:
            resp_u = requests.get("http://usuarios:5000/usuarios", timeout=2)
            if estado_usuarios == CIRCUIT_HALF_OPEN:
                estado_usuarios = CIRCUIT_CLOSED
                fallos_usuarios = 0
                logger.info(f" [RECOVERY_SUCCESS] USUARIOS recuperado")
            else:
                fallos_usuarios = 0
            usuarios_data = resp_u.json()
        except Exception as e:
            fallos_usuarios += 1
            logger.error(f" [FALLO {fallos_usuarios}/{umbral_usuarios}] USUARIOS (Resumen): {str(e)}")
            if estado_usuarios == CIRCUIT_HALF_OPEN or fallos_usuarios >= umbral_usuarios:
                estado_usuarios = CIRCUIT_OPEN
                tiempo_apertura_usuarios = time.time()
                fallos_usuarios = 0

    # --- Lógica para BACKEND ---
    if estado_backend == CIRCUIT_OPEN:
        if (time.time() - tiempo_apertura_backend) >= TIMEOUT_RECUPERACION:
            estado_backend = CIRCUIT_HALF_OPEN
            logger.warning(f" [RECOVERY_START] Intentando recuperación de BACKEND")

    mascotas_data = {"error": "No se pudieron obtener las mascotas"}
    if estado_backend != CIRCUIT_OPEN:
        try:
            resp_b = requests.get("http://backend:5000/mascotas", timeout=2)
            if estado_backend == CIRCUIT_HALF_OPEN:
                estado_backend = CIRCUIT_CLOSED
                fallos_backend = 0
                logger.info(f" [RECOVERY_SUCCESS] BACKEND recuperado")
            else:
                fallos_backend = 0
            mascotas_data = resp_b.json()
        except Exception as e:
            fallos_backend += 1
            logger.error(f" [FALLO {fallos_backend}/{umbral_backend}] BACKEND (Resumen): {str(e)}")
            if estado_backend == CIRCUIT_HALF_OPEN or fallos_backend >= umbral_backend:
                estado_backend = CIRCUIT_OPEN
                tiempo_apertura_backend = time.time()
                fallos_backend = 0

    log_request("/resumen", "GET", start_time, status_code=200)
    return jsonify({
        "usuarios": usuarios_data,
        "mascotas": mascotas_data,
        "timestamp": time.time()
    })

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
