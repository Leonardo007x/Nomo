# Dockerfile del microservicio Media.
FROM node:20-alpine

WORKDIR /app

COPY packages/resilience ./packages/resilience

COPY microservices/servicio-media/package.json ./
RUN npm install --omit=dev

COPY microservices/servicio-media/src ./src

EXPOSE 3004

CMD ["node", "src/index.js"]
