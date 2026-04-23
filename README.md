# Mercado Liebre

Mercado Liebre es una plataforma para que pequeños negocios publiquen y administren su catalogo digital de forma rapida, con gestion de tienda, productos y configuracion visual.

El proyecto implementa una arquitectura de servicios desplegada con Docker Compose, integrada por frontend, API backend y base de datos MySQL.

## Problema que resuelve

Muchos negocios pequenos:
- no cuentan con un sitio propio,
- dependen de herramientas genericas con poco control,
- y tienen dificultad para mantener su catalogo actualizado.

Mercado Liebre centraliza la administracion de tienda y productos, y expone una vista publica consumible por clientes.

## Usuarios del sistema

- **Administrador de plataforma**: gestiona la operacion global.
- **Dueno de negocio**: crea y administra su tienda, productos y configuracion.
- **Cliente/visitante**: navega el catalogo publico.

## Arquitectura implementada (actual)

La solucion actual esta desplegada con Docker Compose y utiliza estos componentes:

- **Frontend**: aplicacion React/Vite servida con Nginx.
- **API**: servicio Node.js + Express (`api-service`).
- **Base de datos**: MySQL 8 (`db-service`).
- **Media externa (opcional)**: Cloudinary para subida de imagenes.

Flujo principal:

1. El usuario accede al frontend en `http://localhost:8080`.
2. Nginx enruta `/api/*` hacia `api-service:3000`.
3. La API consulta/persiste datos en MySQL.
4. Para imagenes, la API usa Cloudinary cuando esta configurado.

## Servicios existentes

### 1) Servicio de autenticacion y usuarios

Implementado dentro de `servicio-api/server.js`:
- registro y login,
- validacion JWT,
- consulta de sesion actual (`/api/auth/me`).

### 2) Servicio de tiendas y configuracion

Implementado en la API:
- creacion y actualizacion de tiendas,
- consulta publica/privada de tienda,
- temas visuales asociados.

### 3) Servicio de productos y categorias

Implementado en la API:
- alta, consulta, actualizacion y eliminacion de productos,
- consulta de categorias por tienda.

### 4) Servicio de medios

Implementado en la API:
- endpoint de subida `POST /api/media/upload`,
- integracion con Cloudinary por variables de entorno.

### 5) Analitica e IA

En el estado actual del backend no existe un microservicio independiente de analitica ni de IA en produccion dentro de Docker Compose.

## Endpoints implementados

### Diagnostico
- `GET /api/health`

### Autenticacion
- `POST /api/auth/register`
- `POST /api/registro` (alias)
- `POST /api/auth/login`
- `POST /api/login` (alias)
- `GET /api/auth/me`

### Tiendas
- `GET /api/tiendas`
- `GET /api/tiendas/destacadas`
- `GET /api/tiendas/mias`
- `GET /api/tiendas/:id`
- `GET /api/tiendas/:id/vista-publica`
- `POST /api/tiendas`
- `PATCH /api/tiendas/:id`

### Temas
- `GET /api/temas`
- `POST /api/temas`
- `PATCH /api/temas/:id`

### Categorias
- `GET /api/categorias`

### Productos
- `GET /api/productos`
- `POST /api/productos`
- `PATCH /api/productos/:id`
- `DELETE /api/productos/:id`

### Media
- `POST /api/media/upload`

## Archivos Docker a presentar

- `docker-compose.yml`: orquestacion de servicios, red y volumen.
- `Dockerfile`: build del frontend y despliegue en Nginx.
- `nginx.conf`: proxy inverso de `/api` a `api-service`.
- `servicio-api/Dockerfile`: contenedor del backend.
- `.dockerignore`: exclusiones de build.
- `init-db/init.sql`: esquema/seed inicial de MySQL.
- `.env`: variables de entorno (sin exponer secretos en la presentacion).

## Datos del sistema

Datos principales:
- usuarios,
- tiendas,
- temas,
- productos,
- categorias.

Datos criticos:
- usuarios (autenticacion),
- tiendas,
- productos.

## Riesgos y mitigacion

### Caida de MySQL
**Impacto:** no se pueden leer ni persistir datos de negocio.  
**Mitigacion:** volumen persistente, respaldos periodicos y manejo de errores en API.

### Caida de Cloudinary
**Impacto:** falla la subida/visualizacion de imagenes externas.  
**Mitigacion:** validacion de configuracion, respuestas controladas y uso de imagenes por defecto.

### Caida del backend API
**Impacto:** el frontend no puede operar sobre datos dinamicos.  
**Mitigacion:** `restart` en Compose, endpoint de health y monitoreo.

## Ejecucion local con Docker

### Requisitos
- Docker
- Docker Compose

### Pasos

1. Configurar variables en `.env` (si aplica).
2. Levantar servicios:

```bash
docker compose up --build
```

3. Abrir:
   - Frontend: `http://localhost:8080`
   - API health: `http://localhost:8080/api/health`

## Pruebas de API con Postman

La coleccion de endpoints se encuentra en:

- `postman/Mercado_Liebre_API.postman_collection.json`

Recomendacion para demo:
1. `GET /api/health`
2. registro/login para obtener token
3. flujo de tienda
4. flujo CRUD de productos
