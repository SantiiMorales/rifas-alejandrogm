@echo off
echo ========================================================
echo   Lanzador del Sistema Rifas Alejandro GM (Monorepo)
echo ========================================================
echo.
echo 1. Iniciando Backend FastAPI en puerto 8000...
start "Backend FastAPI" cmd /k "python backend/run.py"

echo 2. Iniciando Frontend Next.js en puerto 3000...
start "Frontend Next.js" cmd /k "cd frontend && npm run dev"

echo.
echo Servicios iniciados:
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:8000
echo - Swagger:  http://localhost:8000/docs
echo.
pause
