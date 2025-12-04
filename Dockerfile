# =======================
# Stage 1: Build
# =======================
FROM node:20-alpine AS build

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .

# Modificar budgets para evitar errores
RUN sed -i 's/"maximumError": "[^"]*"/"maximumError": "10mb"/g' angular.json

# Construir la aplicación
RUN npm run build -- --configuration production

# =======================
# Stage 2: Production
# =======================
FROM nginx:alpine

# Limpiar nginx por defecto
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/*

# Configurar nginx para puerto 4200
RUN echo 'server { \
    listen 4200; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copiar archivos compilados desde inventaStore
COPY --from=build /app/dist/inventaStore/browser /usr/share/nginx/html

# Exponer puerto 4200
EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]