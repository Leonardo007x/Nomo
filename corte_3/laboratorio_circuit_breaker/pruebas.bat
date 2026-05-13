@echo off
REM =====================================================================
REM  LABORATORIO: SISTEMA QUE APRENDE A FALLAR (Circuit Breaker)
REM  Script de pruebas automatizadas para las 5 fases del laboratorio.
REM
REM  Requisitos:
REM   - Docker Desktop corriendo
REM   - Ejecutar este .bat desde la carpeta laboratorio_circuit_breaker
REM   - Windows con curl.exe (incluido por defecto en Windows 10/11)
REM
REM  Uso:
REM   pruebas.bat           muestra el menu
REM   pruebas.bat all       ejecuta TODAS las fases en orden
REM   pruebas.bat fase1     ejecuta solo la Fase 1
REM   pruebas.bat fase2     ejecuta solo la Fase 2
REM   pruebas.bat fase3     ejecuta solo la Fase 3
REM   pruebas.bat fase4     ejecuta solo la Fase 4
REM   pruebas.bat fase5     ejecuta solo la Fase 5
REM   pruebas.bat reset     reinicia el gateway y vuelve a levantar todo
REM =====================================================================

setlocal EnableExtensions EnableDelayedExpansion

set "GATEWAY=http://localhost:5000"

if "%~1"=="" goto MENU

if /I "%~1"=="all"   goto ALL
if /I "%~1"=="fase1" goto FASE1
if /I "%~1"=="fase2" goto FASE2
if /I "%~1"=="fase3" goto FASE3
if /I "%~1"=="fase4" goto FASE4
if /I "%~1"=="fase5" goto FASE5
if /I "%~1"=="reset" goto RESET

echo Opcion no reconocida: %~1
goto MENU


:MENU
echo.
echo =====================================================
echo  LABORATORIO CIRCUIT BREAKER - MENU DE PRUEBAS
echo =====================================================
echo  1^) Fase 1 - Observar
echo  2^) Fase 2 - Aplicar
echo  3^) Fase 3 - Investigar
echo  4^) Fase 4 - Recuperacion ^(half-open^)
echo  5^) Fase 5 - Validar los 4 escenarios
echo  6^) Ejecutar TODAS las fases en orden
echo  7^) Reset ^(rebuild y levantar todo desde cero^)
echo  0^) Salir
echo =====================================================
set /p OPCION="Selecciona una opcion: "

if "%OPCION%"=="1" goto FASE1
if "%OPCION%"=="2" goto FASE2
if "%OPCION%"=="3" goto FASE3
if "%OPCION%"=="4" goto FASE4
if "%OPCION%"=="5" goto FASE5
if "%OPCION%"=="6" goto ALL
if "%OPCION%"=="7" goto RESET
if "%OPCION%"=="0" goto FIN

echo Opcion invalida.
goto MENU


REM =====================================================================
:ALL
REM Ejecuta todas las fases en orden
REM =====================================================================
call :_HEADER "EJECUTANDO TODAS LAS FASES EN ORDEN"
call :_LEVANTAR
call :FASE1_BODY
call :FASE2_BODY
call :FASE3_BODY
call :FASE4_BODY
call :FASE5_BODY
echo.
echo === FIN: TODAS LAS FASES EJECUTADAS ===
goto FIN


REM =====================================================================
:RESET
REM Limpia y vuelve a levantar todo
REM =====================================================================
call :_HEADER "RESET DEL ENTORNO"
echo Bajando todos los servicios...
docker compose down
echo.
echo Levantando con rebuild...
docker compose up -d --build
echo.
echo Estado actual:
docker compose ps
echo.
goto FIN


REM =====================================================================
REM  FASE 1: OBSERVAR
REM =====================================================================
:FASE1
call :_LEVANTAR
call :FASE1_BODY
goto FIN

:FASE1_BODY
call :_HEADER "FASE 1 - OBSERVAR"
echo Objetivo:
echo  - Apagar el servicio de mascotas
echo  - Hacer varias peticiones al gateway
echo  - Revisar logs
echo.
echo Preguntas a responder en el README:
echo  - Que hace el sistema actualmente?
echo  - Se protege o insiste?
echo.
pause

echo.
echo [1/3] Apagando servicio backend ^(mascotas^)...
docker compose stop backend
echo.

echo [2/3] Lanzando 5 peticiones a /mascotas ^(servicio caido^)...
for /L %%i in (1,1,5) do (
    echo --- Intento %%i ---
    curl.exe -i -s -o - -w "\nHTTP_STATUS=%%{http_code}\n" %GATEWAY%/mascotas
    echo.
    timeout /t 1 /nobreak >nul
)
echo.

echo [3/3] Mostrando ultimos logs del gateway...
docker compose logs --tail=40 gateway
echo.
echo ---------------------------------------------------------------
echo INTERPRETACION DE LOGS ^(Fase 1^)
echo ---------------------------------------------------------------
echo  * "Fallo numero 1 en servicio mascotas"
echo      El gateway intento llamar al backend, no respondio y se
echo      contabilizo como fallo. El circuito sigue CLOSED, asi que
echo      sigue dejando pasar las siguientes peticiones ^(INSISTE^).
echo  * "Fallo numero 2 ... 3 en servicio mascotas"
echo      Se acumulan fallos consecutivos. Cada uno es un intento
echo      real al backend ^(con timeout corto de 2s^).
echo  * "Circuito ABIERTO para servicio mascotas"
echo      Se alcanzo el umbral ^(3 fallos^). A partir de aqui el
echo      gateway YA NO golpea al backend ^(SE PROTEGE^).
echo  * Respuesta HTTP 503 "Servicio mascotas temporalmente bloqueado"
echo      Ya no es un fallo real: es el propio gateway rechazando
echo      para evitar mas dano. Esto es el Circuit Breaker actuando.
echo ---------------------------------------------------------------
pause
exit /b 0


REM =====================================================================
REM  FASE 2: APLICAR (Circuit Breaker en todos los endpoints)
REM =====================================================================
:FASE2
call :_LEVANTAR
call :FASE2_BODY
goto FIN

:FASE2_BODY
call :_HEADER "FASE 2 - APLICAR (Circuit Breaker en multiples endpoints)"
echo Objetivo:
echo  - Verificar que el Circuit Breaker funciona en /mascotas Y /usuarios
echo  - Demostrar AISLAMIENTO: si uno falla, el otro sigue
echo.
pause

echo.
echo [1/5] Asegurando que ambos servicios esten arriba...
docker compose start backend usuarios
timeout /t 3 /nobreak >nul

echo.
echo [2/5] Probando ambos endpoints SANOS:
echo --- /mascotas ---
curl.exe -i -s -o - -w "\nHTTP_STATUS=%%{http_code}\n" %GATEWAY%/mascotas
echo.
echo --- /usuarios ---
curl.exe -i -s -o - -w "\nHTTP_STATUS=%%{http_code}\n" %GATEWAY%/usuarios
echo.
pause

echo.
echo [3/5] Apagando SOLO el servicio backend ^(mascotas^)...
docker compose stop backend
echo.

echo [4/5] Atacando /mascotas para abrir SU circuito ^(4 intentos^):
for /L %%i in (1,1,4) do (
    echo --- Intento %%i a /mascotas ---
    curl.exe -i -s -o - -w "\nHTTP_STATUS=%%{http_code}\n" %GATEWAY%/mascotas
    echo.
)
echo.

echo [5/5] Verificando que /usuarios SIGUE funcionando ^(aislamiento^):
curl.exe -i -s -o - -w "\nHTTP_STATUS=%%{http_code}\n" %GATEWAY%/usuarios
echo.

echo Logs del gateway ^(ultimas 40 lineas^):
docker compose logs --tail=40 gateway
echo.
echo ---------------------------------------------------------------
echo INTERPRETACION DE LOGS ^(Fase 2^)
echo ---------------------------------------------------------------
echo  * "Circuito CERRADO para servicio mascotas" / "para servicio usuarios"
echo      Llamadas iniciales OK: ambos servicios respondieron y el
echo      gateway confirma estado CLOSED ^(todo normal^).
echo  * "Fallo numero N en servicio mascotas" y luego
echo    "Circuito ABIERTO para servicio mascotas"
echo      Solo mascotas acumula fallos y abre SU circuito.
echo      OJO: no aparecen mensajes equivalentes para usuarios.
echo      Eso prueba que el contador es POR SERVICIO.
echo  * "Circuito CERRADO para servicio usuarios" durante las pruebas
echo      /usuarios sigue respondiendo 200 mientras /mascotas esta
echo      bloqueado. Demuestra el AISLAMIENTO de fallos.
echo  * Respuesta 503 solo aparece para /mascotas, no para /usuarios.
echo ---------------------------------------------------------------
pause
exit /b 0


REM =====================================================================
REM  FASE 3: INVESTIGAR (Half-Open)
REM =====================================================================
:FASE3
call :_LEVANTAR
call :FASE3_BODY
goto FIN

:FASE3_BODY
call :_HEADER "FASE 3 - INVESTIGAR (Half-Open)"
echo Esta fase es teorica. Aqui solo se muestra el estado actual y un
echo recordatorio de lo investigado ^(la explicacion completa va en README^).
echo.
echo Resumen:
echo  - half-open: estado de PRUEBA tras una espera, permite UN intento.
echo  - Si el intento funciona ==^> CLOSED ^(servicio recuperado^).
echo  - Si el intento falla    ==^> OPEN   ^(vuelve a bloquear^).
echo.
echo Tiempo de espera configurado en gateway/app.py:
findstr /C:"TIEMPO_RECUPERACION_SEGUNDOS" gateway\app.py
echo.
echo Umbral de fallos configurado:
findstr /C:"UMBRAL_FALLOS" gateway\app.py
echo.
echo ---------------------------------------------------------------
echo INTERPRETACION ^(Fase 3 - half-open^)
echo ---------------------------------------------------------------
echo  Estados del Circuit Breaker que veras en los logs:
echo   * "Circuito CERRADO ..."   = closed     ==^> trafico normal.
echo   * "Circuito ABIERTO ..."   = open       ==^> bloquea por completo
echo                                               durante la espera.
echo   * "Circuito HALF-OPEN ..." = half-open  ==^> permite UN intento
echo                                               de prueba.
echo  Que decide el estado siguiente:
echo   * Si el intento HALF-OPEN responde OK  ==^> "Circuito CERRADO"
echo     ^(servicio recuperado, vuelve trafico normal^).
echo   * Si el intento HALF-OPEN falla        ==^> "Fallo en HALF-OPEN
echo     vuelve a Circuito ABIERTO" ^(el servicio sigue inestable^).
echo ---------------------------------------------------------------
pause
exit /b 0


REM =====================================================================
REM  FASE 4: IMPLEMENTAR (Recuperacion)
REM =====================================================================
:FASE4
call :_LEVANTAR
call :FASE4_BODY
goto FIN

:FASE4_BODY
call :_HEADER "FASE 4 - IMPLEMENTAR (Recuperacion con half-open)"
echo Objetivo:
echo  - Ver la secuencia CLOSED ==^> OPEN ==^> HALF-OPEN ==^> ^(OPEN o CLOSED^)
echo  - Espera controlada de 10s ^(TIEMPO_RECUPERACION_SEGUNDOS^)
echo.
pause

echo.
echo [1/6] Reiniciando gateway para limpiar estado en memoria...
docker compose restart gateway
timeout /t 3 /nobreak >nul

echo.
echo [2/6] Apagando backend ^(mascotas^)...
docker compose stop backend
echo.

echo [3/6] Provocando 4 fallos para ABRIR el circuito de /mascotas:
for /L %%i in (1,1,4) do (
    echo --- Intento %%i ---
    curl.exe -i -s -o - -w "\nHTTP_STATUS=%%{http_code}\n" %GATEWAY%/mascotas
    echo.
)

echo.
echo [4/6] Esperando 11 segundos para que el circuito pase a HALF-OPEN...
timeout /t 11 /nobreak

echo.
echo [5/6] CASO A - Servicio AUN caido. Deberia volver a OPEN.
curl.exe -i -s -o - -w "\nHTTP_STATUS=%%{http_code}\n" %GATEWAY%/mascotas
echo.
echo Esperamos otros 11 segundos para el siguiente HALF-OPEN...
timeout /t 11 /nobreak

echo.
echo [6/6] CASO B - Levantamos backend y probamos. Deberia CERRAR.
docker compose start backend
timeout /t 5 /nobreak >nul
curl.exe -i -s -o - -w "\nHTTP_STATUS=%%{http_code}\n" %GATEWAY%/mascotas
echo.

echo Logs del gateway ^(ultimas 60 lineas^):
docker compose logs --tail=60 gateway
echo.
echo ---------------------------------------------------------------
echo INTERPRETACION DE LOGS ^(Fase 4 - secuencia completa^)
echo ---------------------------------------------------------------
echo Orden esperado en los logs del gateway:
echo  1^) "Fallo numero 1/2/3 en servicio mascotas"
echo      El backend esta caido. Cada uno es un intento real con
echo      timeout, mientras el circuito sigue CLOSED.
echo  2^) "Circuito ABIERTO para servicio mascotas"
echo      Se alcanzo el umbral ^(3 fallos^). El gateway empieza a
echo      responder 503 sin tocar el backend ^(espera controlada^).
echo  3^) Tras 10s sin tocar el backend, llega una peticion y aparece:
echo     "Circuito HALF-OPEN para servicio mascotas: intento de prueba"
echo      El gateway permite UN intento para ver si ya se recupero.
echo  4^) CASO A ^(backend aun caido^):
echo     "Fallo en HALF-OPEN vuelve a Circuito ABIERTO ..."
echo      El intento fallo, vuelve a OPEN y reinicia la espera.
echo  5^) CASO B ^(backend ya levantado^):
echo     "Circuito CERRADO para servicio mascotas"
echo      El intento funciono, el contador de fallos se reinicia
echo      y el trafico vuelve a la normalidad.
echo ---------------------------------------------------------------
pause
exit /b 0


REM =====================================================================
REM  FASE 5: VALIDAR (4 escenarios)
REM =====================================================================
:FASE5
call :_LEVANTAR
call :FASE5_BODY
goto FIN

:FASE5_BODY
call :_HEADER "FASE 5 - VALIDAR (4 escenarios)"
echo Escenarios:
echo  1^) Servicio funcionando
echo  2^) Servicio caido
echo  3^) Circuito abierto
echo  4^) Recuperacion del servicio
echo.
pause

echo.
echo [Escenario 1/4] SERVICIO FUNCIONANDO
docker compose start backend usuarios
timeout /t 3 /nobreak >nul
echo --- /mascotas ---
curl.exe -i -s -o - -w "\nHTTP_STATUS=%%{http_code}\n" %GATEWAY%/mascotas
echo.
echo --- /usuarios ---
curl.exe -i -s -o - -w "\nHTTP_STATUS=%%{http_code}\n" %GATEWAY%/usuarios
echo.
pause

echo.
echo [Escenario 2/4] SERVICIO CAIDO
docker compose restart gateway
timeout /t 3 /nobreak >nul
docker compose stop backend
echo --- /mascotas ^(servicio abajo^) ---
curl.exe -i -s -o - -w "\nHTTP_STATUS=%%{http_code}\n" %GATEWAY%/mascotas
echo.
pause

echo.
echo [Escenario 3/4] CIRCUITO ABIERTO
echo Provocando umbral de fallos en /mascotas...
for /L %%i in (1,1,4) do (
    curl.exe -s -o nul -w "Intento %%i HTTP %%{http_code}\n" %GATEWAY%/mascotas
)
echo Llamada extra: debe responder "temporalmente bloqueado":
curl.exe -i -s -o - -w "\nHTTP_STATUS=%%{http_code}\n" %GATEWAY%/mascotas
echo.
pause

echo.
echo [Escenario 4/4] RECUPERACION DEL SERVICIO
echo Levantando backend y esperando ventana de recuperacion ^(11s^)...
docker compose start backend
timeout /t 11 /nobreak
echo Llamada de prueba ^(debe pasar a HALF-OPEN y luego CERRAR^):
curl.exe -i -s -o - -w "\nHTTP_STATUS=%%{http_code}\n" %GATEWAY%/mascotas
echo.

echo Logs finales del gateway ^(ultimas 80 lineas^):
docker compose logs --tail=80 gateway
echo.
echo ---------------------------------------------------------------
echo INTERPRETACION DE LOGS ^(Fase 5 - 4 escenarios^)
echo ---------------------------------------------------------------
echo  Escenario 1 ^(SERVICIO FUNCIONANDO^):
echo   * "Circuito CERRADO para servicio mascotas" / "para servicio usuarios"
echo   * HTTP 200 con JSON real del microservicio.
echo.
echo  Escenario 2 ^(SERVICIO CAIDO^):
echo   * "Fallo numero 1 / 2 ... en servicio mascotas"
echo   * HTTP 503 con mensaje "Servicio mascotas no disponible".
echo   * Indica que el gateway aun INSISTE ^(circuito CLOSED^).
echo.
echo  Escenario 3 ^(CIRCUITO ABIERTO^):
echo   * "Circuito ABIERTO para servicio mascotas"
echo   * HTTP 503 con "Servicio mascotas temporalmente bloqueado.
echo     Reintente en Ns": ya NO se llama al backend, el gateway
echo     responde solo ^(proteccion activa^).
echo.
echo  Escenario 4 ^(RECUPERACION^):
echo   * "Circuito HALF-OPEN para servicio mascotas: intento de prueba"
echo   * "Circuito CERRADO para servicio mascotas"
echo   * HTTP 200 al recuperarse: contador y estado se reinician.
echo ---------------------------------------------------------------
pause
exit /b 0


REM =====================================================================
REM  Helpers
REM =====================================================================
:_HEADER
echo.
echo =====================================================
echo  %~1
echo =====================================================
exit /b 0

:_LEVANTAR
echo Verificando que los servicios esten arriba...
docker compose up -d >nul 2>&1
timeout /t 3 /nobreak >nul
docker compose ps
echo.
exit /b 0


:FIN
endlocal
echo.
echo Script finalizado.
exit /b 0
