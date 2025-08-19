const prisma = require('../config/database');

class ProjectService {
  // Create a new project
  async createProject(projectData, ownerId) {
    const { name, description, dueDate, priority, color, tags } = projectData;
    
    return await prisma.$transaction(async (tx) => {
      // Create the project
      const project = await tx.project.create({
        data: {
          name,
          description,
          dueDate: dueDate ? new Date(dueDate) : null,
          priority: priority || 'MEDIUM',
          color: color || '#3B82F6',
          ownerId,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      // Add owner as a member
      await tx.projectMember.create({
        data: {
          userId: ownerId,
          projectId: project.id,
          role: 'OWNER',
        },
      });

      // Create default columns
      const defaultColumns = [
        { name: 'To Do', order: 0, color: '#EF4444' },
        { name: 'In Progress', order: 1, color: '#F59E0B' },
        { name: 'Review', order: 2, color: '#8B5CF6' },
        { name: 'Done', order: 3, color: '#10B981' },
      ];

      await tx.projectColumn.createMany({
        data: defaultColumns.map(col => ({
          ...col,
          projectId: project.id,
        })),
      });

      // Create tags if provided
      if (tags && tags.length > 0) {
        await tx.projectTag.createMany({
          data: tags.map(tag => ({
            name: tag,
            projectId: project.id,
          })),
        });
      }

      return project;
    });
  }

  // Get projects for a user
  async getUserProjects(userId, filters = {}) {
    const { status, search, page = 1, limit = 10 } = filters;
    
    const where = {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    };
  }

  // Get project by ID
  async getProjectById(id, userId) {
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        columns: {
          orderBy: { order: 'asc' },
        },
        tags: true,
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    return project;
  }

  // Update project
  async updateProject(id, updateData, userId) {
    // First check if user has permission
    const project = await this.getProjectById(id, userId);
    const userMember = project.members.find(m => m.userId === userId);
    
    if (!userMember || (userMember.role !== 'OWNER' && userMember.role !== 'ADMIN')) {
      throw new Error('Insufficient permissions to update this project');
    }

    const { tags, columns, ...projectData } = updateData;

    return await prisma.$transaction(async (tx) => {
      // Update project
      const updatedProject = await tx.project.update({
        where: { id },
        data: {
          ...projectData,
          dueDate: projectData.dueDate ? new Date(projectData.dueDate) : undefined,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          columns: {
            orderBy: { order: 'asc' },
          },
          tags: true,
        },
      });

      // Update columns if provided
      if (columns) {
        await tx.projectColumn.deleteMany({ where: { projectId: id } });
        await tx.projectColumn.createMany({
          data: columns.map(col => ({
            ...col,
            projectId: id,
          })),
        });
      }

      // Update tags if provided
      if (tags) {
        await tx.projectTag.deleteMany({ where: { projectId: id } });
        if (tags.length > 0) {
          await tx.projectTag.createMany({
            data: tags.map(tag => ({
              name: tag,
              projectId: id,
            })),
          });
        }
      }

      return updatedProject;
    });
  }

  // Delete project
  async deleteProject(id, userId) {
    const project = await this.getProjectById(id, userId);
    
    if (project.ownerId !== userId) {
      throw new Error('Only project owner can delete the project');
    }

    await prisma.project.delete({
      where: { id },
    });
  }

  // Add member to project
  async addMember(projectId, email, role = 'MEMBER', userId) {
    const project = await this.getProjectById(projectId, userId);
    const userMember = project.members.find(m => m.userId === userId);
    
    if (!userMember || (userMember.role !== 'OWNER' && userMember.role !== 'ADMIN')) {
      throw new Error('Insufficient permissions to add members');
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId,
        },
      },
    });

    if (existingMember) {
      throw new Error('User is already a member of this project');
    }

    // Add member
    await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId,
        role: role.toUpperCase(),
      },
    });

    return await this.getProjectById(projectId, userId);
  }

  // Remove member from project
  async removeMember(projectId, memberUserId, userId) {
    const project = await this.getProjectById(projectId, userId);
    const userMember = project.members.find(m => m.userId === userId);
    
    if (!userMember || (userMember.role !== 'OWNER' && userMember.role !== 'ADMIN')) {
      throw new Error('Insufficient permissions to remove members');
    }

    if (project.ownerId === memberUserId) {
      throw new Error('Cannot remove project owner');
    }

    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId: memberUserId,
          projectId,
        },
      },
    });
  }

  // Check if user is member of project
  async isProjectMember(projectId, userId) {
    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    return !!member;
  }

  // Get user role in project
  async getUserRole(projectId, userId) {
    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    return member?.role || null;
  }
}

module.exports = new ProjectService();
