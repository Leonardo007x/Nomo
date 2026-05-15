# Dockerfile del microservicio IA.
FROM node:20-alpine

WORKDIR /app

COPY packages/resilience ./packages/resilience

COPY microservices/servicio-ia/package.json ./
RUN npm install --omit=dev

COPY microservices/servicio-ia/src ./src

EXPOSE 3006

CMD ["node", "src/index.js"]
