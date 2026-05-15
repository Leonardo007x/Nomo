# Dockerfile del microservicio Tiendas.
# Build context = raíz del repo (necesita packages/resilience).

FROM node:20-alpine

WORKDIR /app

COPY packages/resilience ./packages/resilience

COPY microservices/servicio-tiendas/package.json ./
RUN npm install --omit=dev

COPY microservices/servicio-tiendas/src ./src

EXPOSE 3002

CMD ["node", "src/index.js"]
