# Ultra-lightweight Static NGINX Production Container (~15MB image)
FROM nginx:alpine-slim
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY out /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
