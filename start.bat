@echo off
echo.
echo ===============================================
echo      🚀 INICIANDO FAVASTAFF MANAGER
echo ===============================================
echo.

echo 🗄️  Verificando PostgreSQL...
pg_isready >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL no está ejecutándose
    echo    Por favor, inicie PostgreSQL e intente nuevamente
    pause
    exit /b 1
)
echo ✅ PostgreSQL está funcionando

echo.
echo 🚀 Iniciando servicios...
echo.

echo ⚡ Iniciando Backend (Puerto 3000)...
start "FavaStaff Backend" cmd /k "cd backend && npm run dev"

echo ⏳ Esperando que el backend inicie...
timeout /t 5 /nobreak >nul

echo ⚡ Iniciando Frontend (Puerto 3001)...
start "FavaStaff Frontend" cmd /k "cd frontend && npm start"

echo.
echo ===============================================
echo      ✅ SISTEMA INICIADO CORRECTAMENTE
echo ===============================================
echo.
echo 🌐 Frontend: http://localhost:3001
echo 🔧 Backend API: http://localhost:3000
echo.
echo 📋 CREDENCIALES DE ACCESO:
echo    Usuario: admin
echo    Contraseña: hospital123
echo.
echo ⚠️  Para detener: Cerrar las ventanas de comando
echo.
echo ===============================================

echo 🔥 Abriendo navegador en 3 segundos...
timeout /t 3 /nobreak >nul
start http://localhost:3001

echo.
echo ✨ ¡Listo! El sistema FavaStaff Manager está funcionando
echo.
pause
