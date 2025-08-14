#!/bin/bash

echo "🚀 INICIANDO FAVASTAFF MANAGER"
echo "================================"
echo

# Verificar si PostgreSQL está ejecutándose
if ! pg_isready >/dev/null 2>&1; then
    echo "⚠️  PostgreSQL no está ejecutándose"
    echo "   Por favor, inicie PostgreSQL e intente nuevamente"
    exit 1
fi
echo "✅ PostgreSQL está funcionando"

echo
echo "🚀 Iniciando servicios..."
echo

echo "⚡ Iniciando Backend (Puerto 3000)..."
cd backend
npm run dev &
BACKEND_PID=$!

echo "⏳ Esperando que el backend inicie..."
sleep 5

echo "⚡ Iniciando Frontend (Puerto 3001)..."
cd ../frontend
npm start &
FRONTEND_PID=$!

cd ..

echo
echo "================================"
echo "✅ SISTEMA INICIADO CORRECTAMENTE"
echo "================================"
echo
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:3000"
echo
echo "📋 CREDENCIALES DE ACCESO:"
echo "   Usuario: admin"
echo "   Contraseña: hospital123"
echo
echo "⚠️  Para detener: Ctrl+C"
echo
echo "================================"

echo "🔥 Abriendo navegador..."
sleep 3

# Detectar sistema operativo y abrir navegador
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:3001
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:3001
fi

echo "✨ ¡Listo! El sistema FavaStaff Manager está funcionando"

# Esperar a que termine
wait
