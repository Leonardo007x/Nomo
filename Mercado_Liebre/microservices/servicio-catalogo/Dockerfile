# Dockerfile del microservicio Catálogo.
# Construido con `build.context` = raíz del repo (`Mercado_Liebre/`),
# para poder COPY del paquete compartido `packages/resilience` además
# del propio servicio.

FROM node:20-alpine

WORKDIR /app

# 1) Paquete compartido `@mercadoliebre/resilience` (file: dependency).
COPY packages/resilience ./packages/resilience

# 2) Manifiesto del microservicio + instalación de dependencias.
COPY microservices/servicio-catalogo/package.json ./
RUN npm install --omit=dev

# 3) Código fuente del microservicio.
COPY microservices/servicio-catalogo/src ./src

EXPOSE 3003

CMD ["node", "src/index.js"]
