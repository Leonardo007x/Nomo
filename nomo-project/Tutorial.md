## Demo Nomo - Guía rápida

Este documento resume, de manera breve y semi formal, cómo ejecutar la demo y cómo se comunican los contenedores Docker involucrados.

---

## Requisitos previos

- **Docker** y **Docker Compose** instalados.
- Puertos libres:
  - `3000` (backend + frontend).
  - `5432` (Postgres).

---

## Cómo ejecutar el proyecto

1. **Ubicarse en la carpeta del proyecto**

   ```bash
   cd nomo-project
   ```

2. **Levantar los contenedores con Docker Compose**

   ```bash
   docker-compose up --build
   ```

   - La opción `--build` fuerza la reconstrucción de la imagen del servicio `backend` a partir del `Dockerfile` ubicado en `demo/`.
   - Este comando iniciará los siguientes servicios:
     - `supabase-db` (Postgres).
     - `backend` (API y servidor estático para el frontend).

3. **Verificar el arranque de los servicios**

   - En la consola del contenedor `backend` debería aparecer un mensaje similar a:
     ```text
     Backend on 3000
     ```
   - La base de datos Postgres puede tardar unos segundos en estar disponible.

4. **Abrir la aplicación en el navegador**

   - Acceder a `http://localhost:3000` para visualizar la interfaz web.

5. **Detener los contenedores**

   En otra terminal, desde la carpeta `nomo-project`:

   ```bash
   docker-compose down
   ```

---

## Comunicación entre contenedores Docker

- **Frontend y backend**
  - El navegador accede a `http://localhost:3000`.
  - El contenedor `backend` expone el puerto `3000:3000` y sirve tanto la API como los archivos estáticos del frontend.

- **Backend y base de datos Postgres**
  - El contenedor `backend` se conecta al contenedor `supabase-db` utilizando el nombre de servicio `supabase-db` como host.
  - La comunicación se realiza sobre el puerto interno `5432` (mapeado externamente como `5432:5432`).
  - Las variables de entorno típicas de conexión son:
    - `DB_HOST=supabase-db`
    - `DB_PORT=5432`
    - `DB_NAME=postgres`
    - `DB_USER=postgres`
    - `DB_PASS=postgres`

En conjunto, la comunicación sigue el flujo: **navegador → contenedor `backend` → contenedor `supabase-db`**.

