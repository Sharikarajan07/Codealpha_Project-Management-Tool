// Simple test script to verify server setup
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Test MongoDB connection
async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project-management-tool', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connection successful');
    
    // Test basic operations
    const User = require('./models/User');
    const Project = require('./models/Project');
    const Task = require('./models/Task');
    
    console.log('✅ Models loaded successfully');
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
