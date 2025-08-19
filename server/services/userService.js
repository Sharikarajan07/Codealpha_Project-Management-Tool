const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

class UserService {
  // Create a new user
  async createUser(userData) {
    const { name, email, password } = userData;
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return user;
  }

  // Find user by email
  async findByEmail(email, includePassword = false) {
    const selectFields = {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    };

    if (includePassword) {
      selectFields.password = true;
    }

    return await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: selectFields,
    });
  }

  // Find user by ID
  async findById(id, includePassword = false) {
    const selectFields = {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    };

    if (includePassword) {
      selectFields.password = true;
    }

    return await prisma.user.findUnique({
      where: { id },
      select: selectFields,
    });
  }

  // Update user
  async updateUser(id, updateData) {
    return await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Update last login
  async updateLastLogin(id) {
    return await prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  // Compare password
  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Change password
  async changePassword(id, newPassword) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    return await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  // Search users
  async searchUsers(query, excludeUserId, limit = 10) {
    return await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: excludeUserId } },
          { isActive: true },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
      take: limit,
    });
  }

  // Get user with projects
  async getUserWithProjects(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        ownedProjects: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            color: true,
          },
        },
        projectMembers: {
          select: {
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                status: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  // Deactivate user
  async deactivateUser(id) {
    return await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Get user task statistics
  async getUserTaskStats(userId) {
    const stats = await prisma.task.groupBy({
      by: ['status'],
      where: {
        assigneeId: userId,
        isArchived: false,
      },
      _count: {
        status: true,
      },
    });

    // Get overdue tasks count
    const overdueTasks = await prisma.task.count({
      where: {
        assigneeId: userId,
        isArchived: false,
        dueDate: { lt: new Date() },
        status: { notIn: ['Done', 'Completed'] },
      },
    });

    return {
      stats,
      overdue: overdueTasks,
    };
  }

  // Get user's upcoming tasks
  async getUserUpcomingTasks(userId, limit = 5) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return await prisma.task.findMany({
      where: {
        assigneeId: userId,
        isArchived: false,
        dueDate: {
          gte: new Date(),
          lte: nextWeek,
        },
        status: { notIn: ['Done', 'Completed'] },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
    });
  }

  // Get user's recent activity
  async getUserRecentActivity(userId, limit = 10) {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    return await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { creatorId: userId },
        ],
        updatedAt: { gte: lastWeek },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  // Get user's tasks with pagination
  async getUserTasks(userId, filters = {}) {
    const { status, priority, project, page = 1, limit = 20 } = filters;

    const where = {
      assigneeId: userId,
      isArchived: false,
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority.toUpperCase();
    }

    if (project) {
      where.projectId = project;
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: [
          { dueDate: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    };
  }
}

module.exports = new UserService();
