const prisma = require('../config/database');
const projectService = require('./projectService');

class TaskService {
  // Create a new task
  async createTask(taskData, projectId, creatorId) {
    const { title, description, assigneeId, status, priority, dueDate, estimatedHours, tags } = taskData;
    
    // Verify user is project member
    const isMember = await projectService.isProjectMember(projectId, creatorId);
    if (!isMember) {
      throw new Error('Access denied - not a project member');
    }

    // Verify assignee is project member if provided
    if (assigneeId) {
      const assigneeIsMember = await projectService.isProjectMember(projectId, assigneeId);
      if (!assigneeIsMember) {
        throw new Error('Assignee must be a project member');
      }
    }

    // Get the highest position for the status column
    const lastTask = await prisma.task.findFirst({
      where: { 
        projectId, 
        status: status || 'To Do',
      },
      orderBy: { position: 'desc' },
    });

    const position = lastTask ? lastTask.position + 1 : 0;

    return await prisma.$transaction(async (tx) => {
      // Create the task
      const task = await tx.task.create({
        data: {
          title,
          description,
          projectId,
          creatorId,
          assigneeId,
          status: status || 'To Do',
          priority: priority || 'MEDIUM',
          dueDate: dueDate ? new Date(dueDate) : null,
          estimatedHours,
          position,
        },
        include: {
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
          project: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      // Add creator to watchers
      await tx.taskWatcher.create({
        data: {
          userId: creatorId,
          taskId: task.id,
        },
      });

      // Add assignee to watchers if different from creator
      if (assigneeId && assigneeId !== creatorId) {
        await tx.taskWatcher.create({
          data: {
            userId: assigneeId,
            taskId: task.id,
          },
        });
      }

      // Add tags if provided
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          // Find or create tag
          let tag = await tx.projectTag.findFirst({
            where: {
              name: tagName,
              projectId,
            },
          });

          if (!tag) {
            tag = await tx.projectTag.create({
              data: {
                name: tagName,
                projectId,
              },
            });
          }

          // Link tag to task
          await tx.taskTag.create({
            data: {
              taskId: task.id,
              tagId: tag.id,
            },
          });
        }
      }

      return task;
    });
  }

  // Get tasks for a project
  async getProjectTasks(projectId, userId, filters = {}) {
    // Verify user is project member
    const isMember = await projectService.isProjectMember(projectId, userId);
    if (!isMember) {
      throw new Error('Access denied - not a project member');
    }

    const { status, assigneeId, priority, search } = filters;
    
    const where = {
      projectId,
      isArchived: false,
    };

    if (status) {
      where.status = status;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (priority) {
      where.priority = priority.toUpperCase();
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return await prisma.task.findMany({
      where,
      include: {
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
            checklistItems: true,
          },
        },
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Get task by ID
  async getTaskById(id, userId) {
    const task = await prisma.task.findUnique({
      where: { id },
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        checklistItems: {
          orderBy: { createdAt: 'asc' },
        },
        watchers: {
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Verify user is project member
    const isMember = await projectService.isProjectMember(task.project.id, userId);
    if (!isMember) {
      throw new Error('Access denied - not a project member');
    }

    return task;
  }

  // Update task
  async updateTask(id, updateData, userId) {
    const task = await this.getTaskById(id, userId);
    
    // Check if user can edit this task
    const userRole = await projectService.getUserRole(task.project.id, userId);
    const canEdit = task.creatorId === userId || 
                   task.assigneeId === userId || 
                   userRole === 'OWNER' || 
                   userRole === 'ADMIN';

    if (!canEdit) {
      throw new Error('Insufficient permissions to edit this task');
    }

    const { tags, ...taskData } = updateData;

    return await prisma.$transaction(async (tx) => {
      // Update task
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          ...taskData,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
          completedDate: taskData.status === 'Done' || taskData.status === 'Completed' 
            ? new Date() 
            : taskData.status && taskData.status !== 'Done' && taskData.status !== 'Completed'
            ? null
            : undefined,
        },
        include: {
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
          comments: {
            include: {
              author: {
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

      // Add new assignee to watchers if changed
      if (updateData.assigneeId && updateData.assigneeId !== task.assigneeId) {
        const existingWatcher = await tx.taskWatcher.findUnique({
          where: {
            userId_taskId: {
              userId: updateData.assigneeId,
              taskId: id,
            },
          },
        });

        if (!existingWatcher) {
          await tx.taskWatcher.create({
            data: {
              userId: updateData.assigneeId,
              taskId: id,
            },
          });
        }
      }

      return updatedTask;
    });
  }

  // Delete task
  async deleteTask(id, userId) {
    const task = await this.getTaskById(id, userId);
    
    // Check if user can delete this task
    const userRole = await projectService.getUserRole(task.project.id, userId);
    const canDelete = task.creatorId === userId || 
                     userRole === 'OWNER' || 
                     userRole === 'ADMIN';

    if (!canDelete) {
      throw new Error('Insufficient permissions to delete this task');
    }

    await prisma.task.delete({
      where: { id },
    });
  }

  // Add comment to task
  async addComment(taskId, content, authorId) {
    const task = await this.getTaskById(taskId, authorId);

    return await prisma.$transaction(async (tx) => {
      // Create comment
      const comment = await tx.comment.create({
        data: {
          content,
          authorId,
          taskId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      // Add author to watchers if not already watching
      const existingWatcher = await tx.taskWatcher.findUnique({
        where: {
          userId_taskId: {
            userId: authorId,
            taskId,
          },
        },
      });

      if (!existingWatcher) {
        await tx.taskWatcher.create({
          data: {
            userId: authorId,
            taskId,
          },
        });
      }

      return comment;
    });
  }

  // Update comment
  async updateComment(taskId, commentId, content, userId) {
    await this.getTaskById(taskId, userId);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new Error('You can only edit your own comments');
    }

    return await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  // Delete comment
  async deleteComment(taskId, commentId, userId) {
    await this.getTaskById(taskId, userId);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    const task = await this.getTaskById(taskId, userId);
    const userRole = await projectService.getUserRole(task.project.id, userId);
    const canDelete = comment.authorId === userId || 
                     userRole === 'OWNER' || 
                     userRole === 'ADMIN';

    if (!canDelete) {
      throw new Error('Insufficient permissions to delete this comment');
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });
  }
}

module.exports = new TaskService();
