@echo off
echo Starting Project Management Tool Development Environment...
echo.

echo Setting up SQLite database (no installation required)...
cd server
call npm run db:init
cd ..
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm run dev"

timeout /t 3

echo Starting Frontend Client...
start "Frontend Client" cmd /k "cd client && npm start"

echo.
echo Development environment started!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo Database: SQLite (use 'npm run db:studio' to view data)
echo.
echo Demo Credentials:
echo Admin: admin@example.com / admin123
echo Demo User: demo@example.com / demo123
echo.
pause
