const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  console.log('🚀 Initializing SQLite database...');

  try {
    // Check if database file exists
    const dbPath = path.join(__dirname, '..', 'database.db');
    const dbExists = fs.existsSync(dbPath);

    if (!dbExists) {
      console.log('📁 Creating new SQLite database...');
    } else {
      console.log('📁 Using existing SQLite database...');
    }

    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname + '/..' });

    // Push schema to database
    console.log('📋 Setting up database schema...');
    execSync('npx prisma db push', { stdio: 'inherit', cwd: __dirname + '/..' });

    // Test database connection
    console.log('🔌 Testing database connection...');

    // Import Prisma client after generation
    delete require.cache[require.resolve('@prisma/client')];
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    // Check if we need to seed
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('🌱 Database is empty, seeding with sample data...');
      execSync('node prisma/seed.js', { stdio: 'inherit', cwd: __dirname + '/..' });
    } else {
      console.log(`✅ Database already has ${userCount} users, skipping seed.`);
    }

    await prisma.$disconnect();
    
    console.log('🎉 Database initialization completed successfully!');
    console.log('');
    console.log('📊 Database Info:');
    console.log(`   Location: ${dbPath}`);
    console.log('   Type: SQLite');
    console.log('   Status: Ready');
    console.log('');
    console.log('🔧 Management Commands:');
    console.log('   View data: npm run db:studio');
    console.log('   Reset database: npm run db:reset');
    console.log('   Reseed data: npm run db:seed');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
