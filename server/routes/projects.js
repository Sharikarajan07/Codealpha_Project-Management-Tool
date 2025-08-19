const express = require('express');
const { body, validationResult } = require('express-validator');
const projectService = require('../services/projectService');
const userService = require('../services/userService');
const { checkProjectMembership, checkProjectEditPermission } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateProject = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Project name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Please enter a valid date'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Please enter a valid hex color')
];

// @route   GET /api/projects
// @desc    Get all projects for the current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const filters = {
      status,
      search,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await projectService.getUserProjects(req.user.id, filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting projects'
    });
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post('/', validateProject, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, dueDate, priority, color, tags } = req.body;

    const project = await projectService.createProject({
      name,
      description,
      dueDate,
      priority,
      color,
      tags
    }, req.user.id);

    // Emit real-time event
    req.io.emit('project-created', {
      project: project,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating project'
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Get a specific project
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user.id);

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    console.error('Get project error:', error);

    if (error.message === 'Project not found or access denied') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error getting project'
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update a project
// @access  Private
router.put('/:id', checkProjectMembership, checkProjectEditPermission, validateProject, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, status, dueDate, priority, color, tags, columns } = req.body;

    const project = await projectService.updateProject(req.params.id, {
      name,
      description,
      status,
      dueDate,
      priority,
      color,
      tags,
      columns
    }, req.user.id);

    // Emit real-time event
    req.io.to(`project-${project.id}`).emit('project-updated', {
      project: project,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating project'
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    await projectService.deleteProject(req.params.id, req.user.id);

    // Emit real-time event
    req.io.emit('project-deleted', {
      projectId: req.params.id,
      deletedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);

    if (error.message === 'Only project owner can delete the project' ||
        error.message === 'Project not found or access denied') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting project'
    });
  }
});

// @route   POST /api/projects/:id/members
// @desc    Add a member to the project
// @access  Private
router.post('/:id/members', checkProjectMembership, checkProjectEditPermission, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'MEMBER'])
    .withMessage('Role must be ADMIN or MEMBER')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, role = 'MEMBER' } = req.body;

    const project = await projectService.addMember(req.params.id, email, role, req.user.id);

    // Emit real-time event
    req.io.to(`project-${project.id}`).emit('member-added', {
      project: project,
      newMember: { email },
      addedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Member added successfully',
      data: { project }
    });
  } catch (error) {
    console.error('Add member error:', error);

    if (error.message === 'User not found' ||
        error.message === 'User is already a member of this project' ||
        error.message === 'Insufficient permissions to add members') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error adding member'
    });
  }
});

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove a member from the project
// @access  Private
router.delete('/:id/members/:userId', checkProjectMembership, checkProjectEditPermission, async (req, res) => {
  try {
    const { userId } = req.params;

    await projectService.removeMember(req.params.id, userId, req.user.id);

    // Emit real-time event
    req.io.to(`project-${req.params.id}`).emit('member-removed', {
      projectId: req.params.id,
      removedUserId: userId,
      removedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);

    if (error.message === 'Cannot remove project owner' ||
        error.message === 'Insufficient permissions to remove members') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error removing member'
    });
  }
});

module.exports = router;
