#!/bin/bash

echo "Starting Project Management Tool Development Environment..."
echo

echo "Setting up SQLite database (no installation required)..."
cd server
npm run db:init
cd ..
echo

echo "Starting Backend Server..."
cd server && npm run dev &
SERVER_PID=$!

sleep 3

echo "Starting Frontend Client..."
cd client && npm start &
CLIENT_PID=$!

echo
echo "Development environment started!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "Database: SQLite (use 'npm run db:studio' to view data)"
echo
echo "Demo Credentials:"
echo "Admin: admin@example.com / admin123"
echo "Demo User: demo@example.com / demo123"
echo
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo
    echo "Stopping services..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
