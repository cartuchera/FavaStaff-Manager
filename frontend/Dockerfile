FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Instalar serve para servir archivos estáticos
RUN npm install -g serve

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["serve", "-s", "build", "-l", "3001"]
