# Etapa 1: compilar el frontend Vite
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# El lockfile y react-hook-form tienen peers en conflicto; alinear con instalación local estable
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Etapa 2: servir estáticos con Nginx (proxy a api-service vía nginx.conf)
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
