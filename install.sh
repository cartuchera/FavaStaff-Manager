#!/bin/bash

echo "🏥 FAVASTAFF MANAGER - INSTALADOR LINUX/MAC"
echo "=========================================="
echo

echo "📦 Instalando dependencias..."
echo

echo "⚡ Backend (Node.js + Express + PostgreSQL)..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error instalando backend"
    exit 1
fi
echo "✅ Backend instalado correctamente"
echo

echo "⚡ Frontend (React)..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error instalando frontend"
    exit 1
fi
echo "✅ Frontend instalado correctamente"
echo

cd ..

echo "=========================================="
echo "📋 INSTRUCCIONES DE CONFIGURACIÓN"
echo "=========================================="
echo
echo "1️⃣  CONFIGURAR BASE DE DATOS:"
echo "   - Instalar PostgreSQL (si no está instalado)"
echo "   - Crear base de datos: 'gestion-equipos'"
echo "   - Ejecutar script: backend/database/05_sistema_reservas.sql"
echo
echo "2️⃣  CONFIGURAR VARIABLES DE ENTORNO:"
echo "   - Copiar backend/.env.example a backend/.env"
echo "   - Ajustar credenciales de base de datos"
echo
echo "3️⃣  INICIAR EL SISTEMA:"
echo "   - Ejecutar: ./start.sh"
echo "   - O manualmente:"
echo "     * Backend: cd backend && npm run dev"
echo "     * Frontend: cd frontend && npm start"
echo
echo "4️⃣  ACCEDER AL SISTEMA:"
echo "   - URL: http://localhost:3001"
echo "   - Usuario: admin / Contraseña: hospital123"
echo
echo "=========================================="
echo "✅ INSTALACIÓN COMPLETADA"
echo "=========================================="
echo
