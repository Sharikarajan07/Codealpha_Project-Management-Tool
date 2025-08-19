const express = require('express');
const { body, validationResult } = require('express-validator');
const userService = require('../services/userService');

const router = express.Router();

// @route   GET /api/users/search
// @desc    Search users by email or name
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await userService.searchUsers(q.trim(), req.user.id, parseInt(limit));

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching users'
    });
  }
});

// @route   GET /api/users/me/tasks
// @desc    Get current user's assigned tasks
// @access  Private
router.get('/me/tasks', async (req, res) => {
  try {
    const { status, priority, project, page = 1, limit = 20 } = req.query;

    const filters = {
      status,
      priority,
      project,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await userService.getUserTasks(req.user.id, filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user tasks'
    });
  }
});

// @route   GET /api/users/me/dashboard
// @desc    Get dashboard data for current user
// @access  Private
router.get('/me/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get task statistics
    const { stats, overdue } = await userService.getUserTaskStats(userId);

    // Get upcoming tasks
    const upcomingTasks = await userService.getUserUpcomingTasks(userId, 5);

    // Get recent activity
    const recentActivity = await userService.getUserRecentActivity(userId, 10);

    // Format task statistics
    const formattedStats = {
      total: 0,
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0,
      overdue: overdue
    };

    stats.forEach(stat => {
      formattedStats.total += stat._count.status;
      switch (stat.status) {
        case 'To Do':
          formattedStats.todo = stat._count.status;
          break;
        case 'In Progress':
          formattedStats.inProgress = stat._count.status;
          break;
        case 'Review':
          formattedStats.review = stat._count.status;
          break;
        case 'Done':
          formattedStats.done = stat._count.status;
          break;
      }
    });

    res.json({
      success: true,
      data: {
        taskStats: formattedStats,
        upcomingTasks,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting dashboard data'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const user = await userService.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user profile'
    });
  }
});

// @route   PUT /api/users/me/avatar
// @desc    Update user avatar
// @access  Private
router.put('/me/avatar', [
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
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

    const { avatar } = req.body;

    const user = await userService.updateUser(req.user.id, { avatar });

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating avatar'
    });
  }
});

// @route   POST /api/users/me/deactivate
// @desc    Deactivate user account
// @access  Private
router.post('/me/deactivate', async (req, res) => {
  try {
    await userService.deactivateUser(req.user.id);

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deactivating account'
    });
  }
});

module.exports = router;
