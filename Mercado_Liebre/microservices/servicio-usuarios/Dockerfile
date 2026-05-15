# Dockerfile del microservicio Usuarios.
# Build context = raíz del repo, para acceder a `packages/resilience` además del servicio.

FROM node:20-alpine

WORKDIR /app

# 1) Paquete compartido (file: dependency).
COPY packages/resilience ./packages/resilience

# 2) Manifiesto del servicio + instalación.
COPY microservices/servicio-usuarios/package.json ./
RUN npm install --omit=dev

# 3) Código fuente del servicio.
COPY microservices/servicio-usuarios/src ./src

EXPOSE 3001

CMD ["node", "src/index.js"]
