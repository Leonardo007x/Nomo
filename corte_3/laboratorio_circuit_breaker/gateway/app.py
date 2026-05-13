from flask import Flask, jsonify
import requests
import time

app = Flask(__name__)

# =====================================================================
# LABORATORIO: SISTEMA QUE APRENDE A FALLAR (Circuit Breaker)
# ---------------------------------------------------------------------
# Este archivo concentra TODA la logica del Circuit Breaker del gateway.
# Cada bloque esta marcado con la FASE del laboratorio a la que pertenece
# para que sea facil ubicar en el codigo lo que pide la rubrica.
#
#   FASE 1: OBSERVAR     -> comportamiento sin proteccion (referencia historica).
#   FASE 2: APLICAR      -> Circuit Breaker compartido en todos los endpoints.
#   FASE 3: INVESTIGAR   -> half-open (concepto, ver README).
#   FASE 4: IMPLEMENTAR  -> recuperacion automatica con half-open.
#   FASE 5: VALIDAR      -> escenarios probados (ver README + evidencias).
# =====================================================================


# ---------------------------------------------------------------------
# CONFIGURACION GLOBAL DEL CIRCUIT BREAKER
# ---------------------------------------------------------------------
# Estos valores definen "cuando se considera que un servicio fallo" y
# "cuanto esperar antes de probar otra vez". Son los parametros que el
# usuario puede ajustar (Fase 4 pide tiempo de espera definido por uno).
# ---------------------------------------------------------------------

# FASE 2: cuantos fallos consecutivos hacen que se abra el circuito.
UMBRAL_FALLOS = 3

# FASE 2/4: tiempo maximo de espera por respuesta del microservicio.
# Si se pasa, se considera fallo (timeout).
TIMEOUT_SEGUNDOS = 2

# FASE 4: tiempo que el circuito permanece OPEN antes de permitir un
# intento de prueba en estado HALF-OPEN (espera controlada).
TIEMPO_RECUPERACION_SEGUNDOS = 10


# ---------------------------------------------------------------------
# FASE 2 - ESTADO INDEPENDIENTE POR SERVICIO
# ---------------------------------------------------------------------
# Decision de diseno (preguntas de la Fase 2):
#  - Cada servicio tiene su PROPIO contador de fallos.
#  - El circuito se abre de forma INDEPENDIENTE por servicio.
#  - Si un servicio falla, los demas pueden seguir respondiendo.
#
# Para lograrlo se usa un diccionario donde cada clave es un servicio
# logico y guarda su propio estado completo.
# ---------------------------------------------------------------------
circuitos = {
    "mascotas": {
        "fallos": 0,             # contador de fallos consecutivos
        "estado": "closed",      # closed | open | half-open
        "abierto_desde": None,   # marca de tiempo desde que se abrio (Fase 4)
        "url": "http://backend:5000/mascotas",
    },
    "usuarios": {
        "fallos": 0,
        "estado": "closed",
        "abierto_desde": None,
        "url": "http://usuarios:5000/usuarios",
    },
}


# ---------------------------------------------------------------------
# FASE 2 + FASE 4 - LOGICA COMPARTIDA DEL CIRCUIT BREAKER
# ---------------------------------------------------------------------
# Una sola funcion centraliza la proteccion para TODOS los endpoints,
# evitando copiar y pegar la misma logica por ruta (lo pide la Fase 2).
# Aqui dentro tambien vive la recuperacion half-open (Fase 4).
# ---------------------------------------------------------------------
def llamar_servicio(nombre_servicio):
    estado = circuitos[nombre_servicio]
    ahora = time.time()

    # -----------------------------------------------------------------
    # FASE 4: si el circuito esta OPEN, decidir si seguimos bloqueando
    # o pasamos a HALF-OPEN para un intento de prueba.
    # -----------------------------------------------------------------
    if estado["estado"] == "open":
        tiempo_abierto = ahora - (estado["abierto_desde"] or ahora)

        # Aun no ha pasado el tiempo de espera -> seguimos protegiendo.
        if tiempo_abierto < TIEMPO_RECUPERACION_SEGUNDOS:
            segundos_restantes = int(TIEMPO_RECUPERACION_SEGUNDOS - tiempo_abierto)
            return {
                "error": (
                    f"Servicio {nombre_servicio} temporalmente bloqueado. "
                    f"Reintente en {segundos_restantes}s"
                )
            }, 503

        # Ya paso la espera -> habilitamos UN intento controlado.
        estado["estado"] = "half-open"
        print(
            f"Circuito HALF-OPEN para servicio {nombre_servicio}: intento de prueba",
            flush=True,
        )

    # -----------------------------------------------------------------
    # FASE 2: intento real de llamada al microservicio.
    # Se aplica tanto en CLOSED (operacion normal) como en HALF-OPEN
    # (intento de recuperacion definido en la Fase 4).
    # -----------------------------------------------------------------
    try:
        response = requests.get(estado["url"], timeout=TIMEOUT_SEGUNDOS)

        # FASE 4: si la llamada funciona, el servicio se considera sano.
        # Cerramos el circuito y reiniciamos contadores/marcas.
        estado["fallos"] = 0
        estado["estado"] = "closed"
        estado["abierto_desde"] = None
        print(f"Circuito CERRADO para servicio {nombre_servicio}", flush=True)

        return jsonify(response.json())

    except requests.RequestException:
        # -------------------------------------------------------------
        # FASE 4: si el fallo ocurre durante HALF-OPEN, el servicio
        # sigue inestable -> volvemos a OPEN inmediatamente y
        # reiniciamos la ventana de espera.
        # -------------------------------------------------------------
        if estado["estado"] == "half-open":
            estado["estado"] = "open"
            estado["abierto_desde"] = ahora
            print(
                f"Fallo en HALF-OPEN -> Circuito ABIERTO para servicio {nombre_servicio}",
                flush=True,
            )
            return {
                "error": f"Servicio {nombre_servicio} sigue inestable (half-open fallo)"
            }, 503

        # -------------------------------------------------------------
        # FASE 2: estado CLOSED. Acumulamos fallos consecutivos y,
        # si se llega al umbral, abrimos el circuito para proteger
        # al gateway y al backend.
        # -------------------------------------------------------------
        estado["fallos"] += 1
        print(f"Fallo numero {estado['fallos']} en servicio {nombre_servicio}", flush=True)

        if estado["fallos"] >= UMBRAL_FALLOS:
            estado["estado"] = "open"
            estado["abierto_desde"] = ahora
            print(f"Circuito ABIERTO para servicio {nombre_servicio}", flush=True)

        return {"error": f"Servicio {nombre_servicio} no disponible"}, 503


# ---------------------------------------------------------------------
# FASE 2 - ENDPOINTS DEL GATEWAY
# ---------------------------------------------------------------------
# Cada ruta solo DELEGA en la logica compartida. No hay codigo de
# Circuit Breaker duplicado en las rutas: aqui se ve como se "adapta"
# la misma logica a distintos endpoints (mascotas, usuarios, ...).
# ---------------------------------------------------------------------
@app.route("/usuarios")
def usuarios():
    return llamar_servicio("usuarios")


@app.route("/mascotas")
def mascotas():
    return llamar_servicio("mascotas")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
