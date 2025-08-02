# Dockerfile para la aplicación React
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY vite.config.js ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY src ./src
COPY public ./public
COPY index.html ./
COPY deploy/.env ./.env

# Exponer puerto
EXPOSE 5173

# Comando para ejecutar la aplicación en modo desarrollo
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
