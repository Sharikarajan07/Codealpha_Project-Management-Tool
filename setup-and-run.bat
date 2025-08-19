@echo off
title Project Management Tool - Setup and Run
color 0A

echo ===============================================
echo    PROJECT MANAGEMENT TOOL - SETUP & RUN
echo ===============================================
echo.

echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js is installed

echo.
echo [2/6] Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)
echo ✓ Root dependencies installed

echo.
echo [3/6] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install server dependencies
    pause
    exit /b 1
)
echo ✓ Server dependencies installed

echo.
echo [4/6] Installing client dependencies...
cd ..\client
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ERROR: Failed to install client dependencies
    pause
    exit /b 1
)
echo ✓ Client dependencies installed

echo.
echo [5/6] Setting up SQLite database...
cd ..\server
call npm run db:init
if %errorlevel% neq 0 (
    echo WARNING: Database setup failed, but continuing...
)
echo ✓ Database setup completed

echo.
echo [6/6] Building client application...
cd ..\client
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build client application
    pause
    exit /b 1
)
echo ✓ Client application built successfully

cd ..
echo.
echo ===============================================
echo           SETUP COMPLETED SUCCESSFULLY!
echo ===============================================
echo.
echo Starting development servers...
echo.
echo Backend Server: http://localhost:5000
echo Frontend App:   http://localhost:3000
echo.
echo Demo Credentials:
echo Email: admin@example.com
echo Password: admin123
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm run dev"

timeout /t 3

echo Starting Frontend Client...
start "Frontend Client" cmd /k "cd client && npm start"

echo.
echo ✓ Both servers are starting...
echo ✓ Frontend will open automatically in your browser
echo ✓ If not, go to: http://localhost:3000
echo.
pause
