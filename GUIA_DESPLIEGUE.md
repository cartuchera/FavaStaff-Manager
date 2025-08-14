# 🚀 GUÍA DE DESPLIEGUE - FAVASTAFF MANAGER

## 📋 **OPCIONES PARA COMPARTIR EL SISTEMA**

### 🎯 **OPCIÓN 1: DESPLIEGUE EN LA NUBE (RECOMENDADO)**

Esta es la mejor opción para que otros prueben tu sistema sin complicaciones.

#### 🌐 **A. Backend en Railway + Frontend en Vercel (GRATIS)**

##### **1. Desplegar Backend en Railway:**

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. En la carpeta backend/
cd backend
railway login
railway init
railway add postgresql
railway deploy
```

**Configurar variables de entorno en Railway:**
```env
NODE_ENV=production
DB_USER=postgres
DB_PASSWORD=(generado automáticamente)
DB_HOST=(generado automáticamente)
DB_PORT=5432
DB_NAME=railway
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
EMAIL_SISTEMAS=sistemas@hospital.com
EMAIL_RRHH=rrhh@hospital.com
```

##### **2. Desplegar Frontend en Vercel:**

```bash
# 1. En la carpeta frontend/
cd frontend
npm install -g vercel
vercel login
vercel

# 2. Configurar variables de entorno en Vercel dashboard:
REACT_APP_API_URL=https://tu-backend.railway.app
```

---

#### 🔥 **B. Todo en Railway (Alternativa)**

```bash
# Monorepo approach
railway init
railway add postgresql
railway deploy --service backend
railway deploy --service frontend
```

---

### 🎯 **OPCIÓN 2: DOCKER + DOCKER HUB**

Para desarrolladores que quieran ejecutar localmente.

#### **1. Crear Dockerfiles:**

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001
CMD ["npm", "start"]
```

#### **2. Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: favastaff
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database:/docker-entrypoint-initdb.d

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DB_HOST: postgres
      DB_USER: postgres
      DB_PASSWORD: password123
      DB_NAME: favastaff
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3001:3001"
    environment:
      REACT_APP_API_URL: http://localhost:3000
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### **3. Comandos para usuarios:**
```bash
# Para probar el sistema:
git clone tu-repositorio
cd favastaff-manager
docker-compose up -d

# Acceder en: http://localhost:3001
```

---

### 🎯 **OPCIÓN 3: GITHUB + NETLIFY/VERCEL**

#### **1. Subir a GitHub:**
```bash
cd "tu-proyecto"
git init
git add .
git commit -m "🚀 FavaStaff Manager - Sistema completo"

# Crear repositorio en GitHub y luego:
git remote add origin https://github.com/tu-usuario/favastaff-manager.git
git push -u origin main
```

#### **2. README para GitHub:**
```markdown
# 🏥 FavaStaff Manager - Sistema de Gestión Hospitalaria

## 🚀 Demo en Vivo
- **Frontend:** https://favastaff-manager.vercel.app
- **API:** https://favastaff-backend.railway.app

## 📋 Credenciales de Prueba
- **Usuario:** admin
- **Contraseña:** hospital123

## ✨ Características
- ✅ Gestión de Personal Hospitalario
- ✅ Sistema de Reservas de Equipos
- ✅ Calendario Visual Avanzado
- ✅ Notificaciones por Email
- ✅ Dashboard con Métricas

## 🛠️ Instalación Local
\`\`\`bash
# Clonar repositorio
git clone https://github.com/tu-usuario/favastaff-manager.git
cd favastaff-manager

# Backend
cd backend
npm install
npm run dev

# Frontend (nueva terminal)
cd frontend
npm install
npm start
\`\`\`
```

---

### 🎯 **OPCIÓN 4: INSTALACIÓN LOCAL SIMPLIFICADA**

Para que otros instalen fácilmente en su máquina.

#### **Script de instalación automática:**

**install.bat (Windows):**
```batch
@echo off
echo 🏥 Instalando FavaStaff Manager...

echo ⚡ Instalando dependencias del backend...
cd backend
npm install
echo ✅ Backend listo

echo ⚡ Instalando dependencias del frontend...
cd ../frontend
npm install
echo ✅ Frontend listo

echo 🗄️ Configurando base de datos...
echo Por favor, ejecuta el script SQL en pgAdmin 4:
echo backend/database/05_sistema_reservas.sql

echo 🚀 Para iniciar el sistema:
echo 1. Backend: cd backend && npm run dev
echo 2. Frontend: cd frontend && npm start
echo 3. Acceder: http://localhost:3001

pause
```

**start.bat (Windows):**
```batch
@echo off
echo 🚀 Iniciando FavaStaff Manager...

start cmd /k "cd backend && npm run dev"
timeout /t 3
start cmd /k "cd frontend && npm start"

echo ✅ Sistema iniciado
echo 🌐 Frontend: http://localhost:3001
echo 🔧 Backend API: http://localhost:3000
```

---

## 🎯 **RECOMENDACIÓN ESPECÍFICA PARA TU CASO**

### **📍 PASO A PASO RECOMENDADO:**

#### **1. Opción Rápida (30 minutos):**
```bash
# 1. Crear cuenta en Railway y Vercel (gratis)
# 2. Desplegar backend en Railway
cd backend
npm install -g @railway/cli
railway login
railway init
railway add postgresql
railway deploy

# 3. Obtener URL del backend y configurar frontend
cd ../frontend
# Editar src/App.js: cambiar localhost por URL de Railway
npm install -g vercel
vercel login
vercel deploy
```

#### **2. Configurar Base de Datos:**
- En Railway dashboard, conectar a PostgreSQL
- Ejecutar scripts SQL desde `/backend/database/`
- Configurar variables de entorno

#### **3. Crear Usuario de Prueba:**
```sql
-- Ejecutar en Railway PostgreSQL
INSERT INTO usuarios (nombre, apellido, nombre_usuario, contraseña, puesto)
VALUES ('Demo', 'User', 'demo', 'demo123', 'Administrador');
```

#### **4. Compartir:**
```
🏥 FavaStaff Manager - Sistema de Gestión Hospitalaria

🌐 DEMO EN VIVO: https://tu-app.vercel.app

📋 CREDENCIALES:
Usuario: demo
Contraseña: demo123

✨ CARACTERÍSTICAS:
✅ Gestión completa de personal hospitalario
✅ Sistema de reservas de equipos médicos
✅ Calendario visual avanzado
✅ Dashboard con métricas en tiempo real
✅ Notificaciones automáticas por email

🛠️ TECNOLOGÍAS:
- Frontend: React 19 + CSS moderno
- Backend: Node.js + Express + PostgreSQL
- Despliegue: Railway + Vercel
```

---

## 🔧 **ARCHIVOS NECESARIOS PARA COMPARTIR**

### **1. Actualizar package.json scripts:**

**Backend:**
```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "deploy": "railway deploy"
  }
}
```

**Frontend:**
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "deploy": "vercel --prod"
  }
}
```

### **2. Variables de entorno para producción:**

**.env.production (backend):**
```env
NODE_ENV=production
PORT=3000
DB_HOST=${PGHOST}
DB_USER=${PGUSER}
DB_PASSWORD=${PGPASSWORD}
DB_NAME=${PGDATABASE}
DB_PORT=${PGPORT}
```

---

**¿Qué opción prefieres? Te ayudo a implementarla paso a paso** 🚀
