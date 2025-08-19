const express = require('express');
const { body, validationResult } = require('express-validator');
const taskService = require('../services/taskService');
// Middleware imports (removed unused ones)

const router = express.Router();

// Validation middleware
const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot be more than 2000 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Please enter a valid date'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number')
];

// @route   GET /api/tasks/project/:projectId
// @desc    Get all tasks for a project
// @access  Private
router.get('/project/:projectId', async (req, res) => {
  try {
    const { status, assigneeId, priority, search } = req.query;

    const filters = {
      status,
      assigneeId,
      priority,
      search
    };

    const tasks = await taskService.getProjectTasks(req.params.projectId, req.user.id, filters);

    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Get tasks error:', error);

    if (error.message === 'Access denied - not a project member') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error getting tasks'
    });
  }
});

// @route   POST /api/tasks/project/:projectId
// @desc    Create a new task
// @access  Private
router.post('/project/:projectId', validateTask, async (req, res) => {
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

    const { title, description, assigneeId, status, priority, dueDate, estimatedHours, tags } = req.body;

    const task = await taskService.createTask({
      title,
      description,
      assigneeId,
      status,
      priority,
      dueDate,
      estimatedHours,
      tags
    }, req.params.projectId, req.user.id);

    // Emit real-time event
    req.io.to(`project-${req.params.projectId}`).emit('task-created', {
      task: task,
      projectId: req.params.projectId,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Create task error:', error);

    if (error.message === 'Access denied - not a project member' ||
        error.message === 'Assignee must be a project member') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating task'
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get a specific task
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user.id);

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Get task error:', error);

    if (error.message === 'Task not found' ||
        error.message === 'Access denied - not a project member') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error getting task'
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', validateTask, async (req, res) => {
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

    const { title, description, assigneeId, status, priority, dueDate, estimatedHours, actualHours, tags, position } = req.body;

    const task = await taskService.updateTask(req.params.id, {
      title,
      description,
      assigneeId,
      status,
      priority,
      dueDate,
      estimatedHours,
      actualHours,
      tags,
      position
    }, req.user.id);

    // Emit real-time event
    req.io.to(`project-${task.projectId}`).emit('task-updated', {
      task: task,
      projectId: task.projectId,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Update task error:', error);

    if (error.message === 'Insufficient permissions to edit this task' ||
        error.message === 'Assignee must be a project member' ||
        error.message === 'Task not found') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating task'
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    // Get task info before deletion for the event
    const task = await taskService.getTaskById(req.params.id, req.user.id);

    await taskService.deleteTask(req.params.id, req.user.id);

    // Emit real-time event
    req.io.to(`project-${task.project.id}`).emit('task-deleted', {
      taskId: req.params.id,
      projectId: task.project.id,
      deletedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);

    if (error.message === 'Insufficient permissions to delete this task' ||
        error.message === 'Task not found') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting task'
    });
  }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add a comment to a task
// @access  Private
router.post('/:id/comments', [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
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

    const { content } = req.body;

    const comment = await taskService.addComment(req.params.id, content, req.user.id);

    // Get task info for the event
    const task = await taskService.getTaskById(req.params.id, req.user.id);

    // Emit real-time event
    req.io.to(`project-${task.project.id}`).emit('comment-added', {
      taskId: req.params.id,
      projectId: task.project.id,
      comment: comment,
      addedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding comment'
    });
  }
});

// @route   PUT /api/tasks/:id/comments/:commentId
// @desc    Update a comment
// @access  Private
router.put('/:id/comments/:commentId', [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
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

    const { content } = req.body;
    const { commentId } = req.params;

    const comment = await taskService.updateComment(req.params.id, commentId, content, req.user.id);

    // Get task info for the event
    const task = await taskService.getTaskById(req.params.id, req.user.id);

    // Emit real-time event
    req.io.to(`project-${task.project.id}`).emit('comment-updated', {
      taskId: req.params.id,
      projectId: task.project.id,
      comment: comment,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment }
    });
  } catch (error) {
    console.error('Update comment error:', error);

    if (error.message === 'Comment not found' ||
        error.message === 'You can only edit your own comments') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating comment'
    });
  }
});

// @route   DELETE /api/tasks/:id/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    // Get task info for the event before deletion
    const task = await taskService.getTaskById(req.params.id, req.user.id);

    await taskService.deleteComment(req.params.id, commentId, req.user.id);

    // Emit real-time event
    req.io.to(`project-${task.project.id}`).emit('comment-deleted', {
      taskId: req.params.id,
      projectId: task.project.id,
      commentId: commentId,
      deletedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);

    if (error.message === 'Comment not found' ||
        error.message === 'Insufficient permissions to delete this comment') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting comment'
    });
  }
});

module.exports = router;
