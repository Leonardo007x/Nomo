# Dockerfile del microservicio Categorías.
FROM node:20-alpine

WORKDIR /app

COPY packages/resilience ./packages/resilience

COPY microservices/servicio-categorias/package.json ./
RUN npm install --omit=dev

COPY microservices/servicio-categorias/src ./src

EXPOSE 3005

CMD ["node", "src/index.js"]
