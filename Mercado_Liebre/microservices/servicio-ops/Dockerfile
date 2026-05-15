# Panel de operaciones: requiere montar /var/run/docker.sock en docker-compose.
FROM node:20-alpine

WORKDIR /app

COPY microservices/servicio-ops/package.json ./
RUN npm install --omit=dev

COPY microservices/servicio-ops/public ./public
COPY microservices/servicio-ops/src ./src

EXPOSE 3007

CMD ["node", "src/index.js"]
