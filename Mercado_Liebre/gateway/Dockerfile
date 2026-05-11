FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY snippets/proxy-api.conf /etc/nginx/snippets/proxy-api.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
