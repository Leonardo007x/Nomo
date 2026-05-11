# Mercado Liebre

Mercado Liebre es una plataforma para que pequeños negocios publiquen y administren su catalogo digital de forma rapida, con gestion de tienda, productos y configuracion visual.

El proyecto implementa **microservicios** con Docker Compose: API Gateway (Nginx), tres backends Node (usuarios, tiendas, catálogo), cada uno con **su propia base MySQL**, más frontend React servido por Nginx.

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

Componentes en Docker Compose:

- **Frontend**: React/Vite compilado, servido por Nginx (`frontend`, puerto host **8080**).
- **API Gateway**: Nginx (`gateway`, puerto host **3000**) enruta `/api/*` al microservicio correspondiente.
- **usuarios-service** + **db-usuarios** (`usuarios_db`): registro, login, JWT, `/api/auth/me`.
- **tiendas-service** + **db-tiendas** (`tiendas_db`): tiendas, temas, vista pública agrega productos llamando por HTTP al catálogo.
- **catalogo-service** + **db-catalogo** (`catalogo_db`): productos, categorías, subida a Cloudinary. Valida dueño de tienda vía HTTP a `tiendas-service` (`/internal/...`) con `INTERNAL_SERVICE_TOKEN`.

Flujo principal:

1. El usuario entra en `http://localhost:8080`.
2. El Nginx del frontend envía `/api/*` al **gateway**.
3. El gateway reenvía a usuarios, tiendas o catálogo según la ruta.
4. Cada microservicio usa solo su MySQL; no hay FK entre bases (referencias lógicas por `usuario_id` / `tienda_id`).

Comunicación entre servicios:

- **Tiendas → Catálogo**: `GET /api/productos?tienda_id=...` para armar `vista-publica`.
- **Catálogo → Tiendas**: `GET /internal/tiendas/:id/owner` (token interno) antes de crear/editar/borrar productos.

El monolito histórico `servicio-api/` quedó solo como referencia (`servicio-api/DEPRECATED.md`).

## Endpoints implementados

### Diagnostico
- `GET /api/health` (respuesta del gateway; cada microservicio también expone `/api/health` en su puerto interno)

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

- `docker-compose.yml`: gateway, 3 microservicios, 3 MySQL, frontend, red y volúmenes.
- `gateway/`: Dockerfile + `nginx.conf` (API Gateway).
- `Dockerfile`: build del frontend y Nginx del SPA.
- `nginx.conf`: proxy del SPA hacia `gateway:80/api/`.
- `servicio-usuarios/`, `servicio-tiendas/`, `servicio-catalogo/`: Dockerfile + `server.js` + `init-db/init.sql` cada uno.
- `.dockerignore`: exclusiones de build.
- `.env` / `.env.example`: secretos y JWT; **no** subir `.env` real a Git.

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

### Caida de una base MySQL
**Impacto:** cae el dominio que usa esa BD (usuarios, tiendas o catálogo); el resto puede seguir parcialmente arriba.  
**Mitigacion:** volúmenes por BD, healthchecks, respaldos y mensajes de error claros en API.

### Caida de Cloudinary
**Impacto:** falla la subida/visualizacion de imagenes externas.  
**Mitigacion:** validacion de configuracion, respuestas controladas y uso de imagenes por defecto.

### Caida de un microservicio o del gateway
**Impacto:** las rutas enrutadas a ese servicio fallan; si cae el gateway, no hay entrada unificada a la API.  
**Mitigacion:** `restart` en Compose, healthchecks y (en producción) réplicas y balanceo.

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
   - Health vía SPA: `http://localhost:8080/api/health`
   - Gateway directo (Postman / dev): `http://localhost:3000/api/health`

Desarrollo local sin Docker del frontend: el proxy de Vite (`vite.config.ts`) apunta a `http://127.0.0.1:3000` (gateway).

## Pruebas de API con Postman

La coleccion de endpoints se encuentra en:

- `postman/Mercado_Liebre_API.postman_collection.json`

Recomendacion para demo:
1. `GET /api/health`
2. registro/login para obtener token
3. flujo de tienda
4. flujo CRUD de productos
