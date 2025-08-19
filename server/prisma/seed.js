const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: demoPassword,
      role: 'USER',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create sample project
  const project = await prisma.project.create({
    data: {
      name: 'Sample Project',
      description: 'This is a sample project to demonstrate the project management tool',
      status: 'ACTIVE',
      priority: 'HIGH',
      color: '#3B82F6',
      ownerId: admin.id,
      allowComments: true,
      allowFileUploads: true,
      emailNotifications: true,
    },
  });

  console.log('✅ Created sample project:', project.name);

  // Add admin as project owner
  await prisma.projectMember.create({
    data: {
      userId: admin.id,
      projectId: project.id,
      role: 'OWNER',
    },
  });

  // Add demo user as project member
  await prisma.projectMember.create({
    data: {
      userId: demoUser.id,
      projectId: project.id,
      role: 'MEMBER',
    },
  });

  console.log('✅ Added project members');

  // Create default columns
  const columns = [
    { name: 'To Do', order: 0, color: '#EF4444' },
    { name: 'In Progress', order: 1, color: '#F59E0B' },
    { name: 'Review', order: 2, color: '#8B5CF6' },
    { name: 'Done', order: 3, color: '#10B981' },
  ];

  for (const column of columns) {
    await prisma.projectColumn.create({
      data: {
        ...column,
        projectId: project.id,
      },
    });
  }

  console.log('✅ Created project columns');

  // Create sample tags
  const tags = ['Frontend', 'Backend', 'Bug', 'Feature', 'Documentation'];
  for (const tagName of tags) {
    await prisma.projectTag.create({
      data: {
        name: tagName,
        projectId: project.id,
      },
    });
  }

  console.log('✅ Created project tags');

  // Create sample tasks
  const tasks = [
    {
      title: 'Set up project structure',
      description: 'Initialize the project with proper folder structure and configuration files',
      status: 'Done',
      priority: 'HIGH',
      creatorId: admin.id,
      assigneeId: admin.id,
      position: 0,
    },
    {
      title: 'Design user interface',
      description: 'Create wireframes and mockups for the main user interface',
      status: 'In Progress',
      priority: 'MEDIUM',
      creatorId: admin.id,
      assigneeId: demoUser.id,
      position: 0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      title: 'Implement authentication',
      description: 'Add user registration, login, and authentication middleware',
      status: 'To Do',
      priority: 'HIGH',
      creatorId: admin.id,
      position: 0,
    },
    {
      title: 'Write API documentation',
      description: 'Document all API endpoints with examples and response formats',
      status: 'To Do',
      priority: 'LOW',
      creatorId: demoUser.id,
      assigneeId: demoUser.id,
      position: 1,
    },
    {
      title: 'Fix responsive layout issues',
      description: 'Resolve layout problems on mobile devices',
      status: 'Review',
      priority: 'MEDIUM',
      creatorId: demoUser.id,
      assigneeId: admin.id,
      position: 0,
    },
  ];

  for (const taskData of tasks) {
    const task = await prisma.task.create({
      data: {
        ...taskData,
        projectId: project.id,
        completedDate: taskData.status === 'Done' ? new Date() : null,
      },
    });

    // Add creator to watchers
    await prisma.taskWatcher.create({
      data: {
        userId: taskData.creatorId,
        taskId: task.id,
      },
    });

    // Add assignee to watchers if different from creator
    if (taskData.assigneeId && taskData.assigneeId !== taskData.creatorId) {
      await prisma.taskWatcher.create({
        data: {
          userId: taskData.assigneeId,
          taskId: task.id,
        },
      });
    }

    console.log('✅ Created task:', task.title);
  }

  // Create sample comments
  const sampleTask = await prisma.task.findFirst({
    where: { title: 'Design user interface' },
  });

  if (sampleTask) {
    await prisma.comment.create({
      data: {
        content: 'I\'ve started working on the wireframes. Should have the initial designs ready by tomorrow.',
        authorId: demoUser.id,
        taskId: sampleTask.id,
      },
    });

    await prisma.comment.create({
      data: {
        content: 'Great! Make sure to consider mobile-first design principles.',
        authorId: admin.id,
        taskId: sampleTask.id,
      },
    });

    console.log('✅ Created sample comments');
  }

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('Admin: admin@example.com / admin123');
  console.log('Demo User: demo@example.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
