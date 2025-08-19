const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const projectService = require('../services/projectService');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await userService.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Middleware to check project membership
const checkProjectMembership = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Check if user is a member of the project
    const isMember = await projectService.isProjectMember(projectId, req.user.id);

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not a project member'
      });
    }

    // Get user role in project
    const userRole = await projectService.getUserRole(projectId, req.user.id);

    // Add project ID and user role to request
    req.projectId = projectId;
    req.userRole = userRole;
    next();
  } catch (error) {
    console.error('Project membership check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking project membership'
    });
  }
};

// Middleware to check if user can edit project
const checkProjectEditPermission = (req, res, next) => {
  if (req.userRole !== 'OWNER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to edit this project'
    });
  }
  next();
};

// Middleware to check task permissions
const checkTaskPermission = async (req, res, next) => {
  try {
    const taskService = require('../services/taskService');
    const taskId = req.params.taskId || req.params.id;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    // This will check if user has access to the task
    const task = await taskService.getTaskById(taskId, req.user.id);

    // Get user role in project
    const userRole = await projectService.getUserRole(task.projectId, req.user.id);

    // Add task and user role to request
    req.task = task;
    req.userRole = userRole;
    next();
  } catch (error) {
    console.error('Task permission check error:', error);

    if (error.message === 'Task not found' || error.message === 'Access denied - not a project member') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error checking task permissions'
    });
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  checkProjectMembership,
  checkProjectEditPermission,
  checkTaskPermission,
  generateToken
};
