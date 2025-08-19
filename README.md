# 🚀 Project Management Tool

A beautiful, modern project management application with stunning UI, animations, and perfect alignment. Built with React, Node.js, and SQLite.

![Project Management Tool](https://img.shields.io/badge/Status-Ready%20to%20Run-brightgreen)
![React](https://img.shields.io/badge/React-18.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightblue)

## ✨ Features

- 🎨 **Beautiful Modern UI** with glassmorphism effects
- 🌙 **Dark/Light Theme** support
- 📱 **Fully Responsive** design
- ⚡ **Smooth Animations** and transitions
- 🔐 **Secure Authentication** system
- 📊 **Interactive Dashboard** with statistics
- 📋 **Project Management** (Create, Edit, Delete)
- ✅ **Task Management** with filters
- 👥 **Team Collaboration** features
- 🔍 **Advanced Search** and filtering
- 💾 **SQLite Database** (no setup required)

## 🛠️ Prerequisites

Before running the project, make sure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Git** (optional) - [Download here](https://git-scm.com/)

**Note**: No database installation required! Uses SQLite with automatic setup.

## Result

<img width="1912" height="932" alt="Screenshot 2025-08-19 210408" src="https://github.com/user-attachments/assets/c7d7f7d4-e3f9-4528-814e-6266e9a869d1" />

<img width="1897" height="928" alt="Screenshot 2025-08-19 211517" src="https://github.com/user-attachments/assets/9bc908cd-0a0d-47cd-af67-749b18a8ce9c" />

<img width="1913" height="927" alt="Screenshot 2025-08-19 210442" src="https://github.com/user-attachments/assets/750951f3-1702-4678-8700-5ec1b0229531" />

<img width="1905" height="929" alt="Screenshot 2025-08-19 211430" src="https://github.com/user-attachments/assets/ee129c84-3327-423f-b816-92528e1c1fb2" />



## 🚀 Quick Start 

### Option 1: One-Click Setup (Windows)
```bash
# Double-click this file to setup and run everything automatically
setup-and-run.bat
```

### Option 2: PowerShell Setup (Windows)
```powershell
# Run in PowerShell
.\setup-and-run.ps1
```

### Option 3: Manual Setup (All Platforms)

#### Step 1: Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install --legacy-peer-deps
```

#### Step 2: Setup Database
```bash
# From server directory
cd server
npm run db:init
```

#### Step 3: Start the Application
```bash
# Option A: Start both servers with one command (from root)
npm run dev

# Option B: Start servers separately
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

## 🌐 Access the Application

Once running, open your browser and go to:

- **Frontend App**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 👤 Demo Credentials

Use these test accounts to explore the application:

**Admin Account:**
- Email: `admin@example.com`
- Password: `admin123`

**Demo User:**
- Email: `demo@example.com`
- Password: `demo123`

## 📋 Available Commands

### Root Directory Commands
```bash
npm run dev          # Start both frontend and backend
npm run server       # Start only backend server
npm run client       # Start only frontend client
npm run build        # Build frontend for production
npm run install-all  # Install all dependencies
```

### Server Commands (from /server directory)
```bash
npm run dev          # Start development server with hot reload
npm start            # Start production server
npm run db:init      # Initialize SQLite database
npm run db:reset     # Reset database to initial state
npm run db:studio    # Open database viewer (if available)
npm test             # Run server tests
```

### Client Commands (from /client directory)
```bash
npm start            # Start development server
npm run build        # Build for production
npm test             # Run client tests
npm run eject        # Eject from Create React App (not recommended)
```

## 🏗️ Project Structure

```
project-management-tool/
├── 📁 client/                 # React Frontend
│   ├── 📁 public/            # Static files
│   ├── 📁 src/
│   │   ├── 📁 components/    # Reusable UI components
│   │   ├── 📁 pages/         # Page components
│   │   ├── 📁 context/       # React Context providers
│   │   ├── 📁 services/      # API service layer
│   │   ├── 📁 types/         # TypeScript type definitions
│   │   └── 📁 utils/         # Utility functions
│   └── 📄 package.json
├── 📁 server/                 # Node.js Backend
│   ├── 📁 config/            # Configuration files
│   ├── 📁 controllers/       # Route controllers
│   ├── 📁 middleware/        # Custom middleware
│   ├── 📁 models/            # Database models
│   ├── 📁 routes/            # API routes
│   ├── 📁 services/          # Business logic
│   ├── 📁 utils/             # Utility functions
│   └── 📄 package.json
├── 📄 setup-and-run.bat      # Windows setup script
├── 📄 setup-and-run.ps1      # PowerShell setup script
└── 📄 package.json           # Root package.json
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Port Already in Use
```bash
# Kill processes on ports 3000 and 5000
npx kill-port 3000
npx kill-port 5000

# Or change ports in configuration files
```

#### Database Issues
```bash
# Reset the database
cd server
rm database.db
npm run db:init
```

#### Dependency Issues
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For client specifically
cd client
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### Build Errors
```bash
# Clear build cache and rebuild
cd client
rm -rf build
npm run build
```

### Environment Issues

#### Windows PowerShell Execution Policy
```powershell
# If you get execution policy errors
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Node.js Version Issues
```bash
# Check Node.js version (should be 16+)
node --version

# Update Node.js if needed
# Download from: https://nodejs.org/
```

## 🎯 Development Workflow

### Making Changes
1. **Frontend changes**: Edit files in `/client/src/`
2. **Backend changes**: Edit files in `/server/`
3. **Database changes**: Modify `/server/models/` and run `npm run db:init`

### Testing
```bash
# Test backend
cd server
npm test

# Test frontend
cd client
npm test
```

### Building for Production
```bash
# Build frontend
cd client
npm run build

# The build files will be in client/build/
```

## 🌟 Key Features Explained

### Beautiful UI Components
- **Glassmorphism effects** with backdrop blur
- **Smooth animations** with CSS transitions
- **Gradient backgrounds** and modern styling
- **Perfect alignment** and responsive design

### Authentication System
- **JWT-based authentication**
- **Secure password hashing**
- **Protected routes**
- **User session management**

### Project Management
- **Create and manage projects**
- **Assign team members**
- **Track project progress**
- **Project-specific dashboards**

### Task Management
- **Create and assign tasks**
- **Set priorities and due dates**
- **Filter and search tasks**
- **Task status tracking**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


**Happy Project Managing! 🎉**
