# Project Management Tool - Setup and Run Script
# PowerShell version for better compatibility

Write-Host "===============================================" -ForegroundColor Green
Write-Host "   PROJECT MANAGEMENT TOOL - SETUP & RUN" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check Node.js installation
Write-Host "[1/6] Checking Node.js installation..." -ForegroundColor Yellow
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please download and install Node.js from: https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install root dependencies
Write-Host ""
Write-Host "[2/6] Installing root dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✓ Root dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to install root dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install server dependencies
Write-Host ""
Write-Host "[3/6] Installing server dependencies..." -ForegroundColor Yellow
try {
    Set-Location server
    npm install
    Write-Host "✓ Server dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to install server dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install client dependencies
Write-Host ""
Write-Host "[4/6] Installing client dependencies..." -ForegroundColor Yellow
try {
    Set-Location ..\client
    npm install --legacy-peer-deps
    Write-Host "✓ Client dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to install client dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Setup database
Write-Host ""
Write-Host "[5/6] Setting up SQLite database..." -ForegroundColor Yellow
try {
    Set-Location ..\server
    npm run db:init
    Write-Host "✓ Database setup completed" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Database setup failed, but continuing..." -ForegroundColor Yellow
}

# Build client
Write-Host ""
Write-Host "[6/6] Building client application..." -ForegroundColor Yellow
try {
    Set-Location ..\client
    npm run build
    Write-Host "✓ Client application built successfully" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to build client application" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "          SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Starting development servers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend Server: http://localhost:5000" -ForegroundColor White
Write-Host "Frontend App:   http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Demo Credentials:" -ForegroundColor Yellow
Write-Host "Email: admin@example.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host ""

# Start servers
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

Start-Sleep -Seconds 3

Write-Host "Starting Frontend Client..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm start"

Write-Host ""
Write-Host "✓ Both servers are starting..." -ForegroundColor Green
Write-Host "✓ Frontend will open automatically in your browser" -ForegroundColor Green
Write-Host "✓ If not, go to: http://localhost:3000" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to continue"
