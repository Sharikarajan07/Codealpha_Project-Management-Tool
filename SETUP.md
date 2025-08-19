# Project Management Tool - Setup Guide

## Prerequisites

Before running the project, make sure you have the following installed:

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **Git** (optional) - [Download here](https://git-scm.com/)

**Note**: No database installation required! The project uses SQLite which creates a local database file automatically.

## Installation Steps

### 1. Install Dependencies

Open a terminal/command prompt and navigate to the project directory:

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

### 2. Set up Environment Variables

The server `.env` file is already created with default values. You can modify it if needed:

```bash
# server/.env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./database.db"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

### 3. Set up the Database (Automatic)

The project uses SQLite, so no database installation is required! The database will be created automatically when you first run the application.

```bash
cd server
npm run db:init
```

This will:
- Create a local `database.db` file in the server directory
- Set up all the required tables and relationships
- Populate the database with sample data (if empty)
- Generate the Prisma client

### 4. Start the Application

#### Option 1: Use the startup scripts
**Windows**: Double-click `start-dev.bat`
**macOS/Linux**: Run `chmod +x start-dev.sh && ./start-dev.sh`

#### Option 2: Manual start

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd client
npm start
```

#### Option 3: Use concurrently (from root directory)
```bash
npm run dev
```

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health

## Default Test User

You can create a new account or use these test credentials:
- Email: admin@example.com
- Password: password123

## Project Structure

```
project-management-tool/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # Context providers
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── package.json
├── server/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── package.json
└── package.json           # Root package.json
```

## Features Implemented

### Backend (Complete)
- ✅ User authentication (JWT)
- ✅ User registration and login
- ✅ Project management (CRUD)
- ✅ Task management (CRUD)
- ✅ Comments system
- ✅ Team member management
- ✅ Real-time updates (Socket.io)
- ✅ MongoDB database with Mongoose
- ✅ Input validation and error handling

### Frontend (Basic Structure Complete)
- ✅ React with TypeScript
- ✅ Authentication system
- ✅ Routing with React Router
- ✅ Context API for state management
- ✅ Tailwind CSS styling
- ✅ API service layer
- ✅ Socket.io client integration
- ✅ Basic dashboard
- ✅ Login/Register pages
- ✅ Responsive layout with sidebar

### Still To Implement
- 🔄 Project board with drag-and-drop
- 🔄 Task cards and detailed views
- 🔄 Real-time collaboration features
- 🔄 File upload functionality
- 🔄 Advanced filtering and search
- 🔄 Notifications system
- 🔄 User profile management
- 🔄 Project settings and permissions

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add team member
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Tasks
- `GET /api/tasks/project/:projectId` - Get project tasks
- `POST /api/tasks/project/:projectId` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment
- `PUT /api/tasks/:id/comments/:commentId` - Update comment
- `DELETE /api/tasks/:id/comments/:commentId` - Delete comment

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/me/tasks` - Get user's tasks
- `GET /api/users/me/dashboard` - Get dashboard data

## Troubleshooting

### Common Issues

1. **Database Issues**
   - Delete `database.db` file and run `npm run db:init` again
   - Check that the server directory is writable

2. **Port Already in Use**
   - Change the PORT in server/.env
   - Kill the process using the port

3. **Dependencies Issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again
   - For client, use `npm install --legacy-peer-deps`

4. **CORS Errors**
   - Check CORS_ORIGIN in server/.env
   - Make sure it matches your frontend URL

### Development Tips

1. **Hot Reload**: Both server and client support hot reload
2. **Database**: Use MongoDB Compass for database visualization
3. **API Testing**: Use Postman or similar tools to test API endpoints
4. **Logs**: Check console logs for debugging information

## Next Steps

1. Implement the Kanban board with drag-and-drop
2. Add real-time notifications
3. Implement file upload for task attachments
4. Add advanced search and filtering
5. Implement user roles and permissions
6. Add email notifications
7. Create mobile-responsive design improvements
8. Add data visualization and reporting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
