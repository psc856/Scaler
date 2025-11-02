@echo off
echo ========================================
echo   Google Calendar Clone - Startup
echo ========================================
echo.

echo Installing dependencies...
echo.

echo [1/4] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend dependency installation failed
    pause
    exit /b 1
)

echo [2/4] Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependency installation failed
    pause
    exit /b 1
)

echo [3/4] Starting backend server...
cd ..\backend
start "Backend Server" cmd /k "npm run dev"

echo [4/4] Starting frontend server...
cd ..\frontend
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo   Backend:  http://localhost:5002
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to exit...
pause > nul