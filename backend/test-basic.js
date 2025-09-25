// Basic test to verify the backend can start
const { exec } = require('child_process');

console.log('Testing basic backend functionality...');

// Test if we can import the main module
try {
  const { AppModule } = require('./dist/app.module');
  console.log('✅ AppModule imported successfully');
} catch (error) {
  console.log('❌ Failed to import AppModule:', error.message);
}

// Test if we can import Prisma service
try {
  const { PrismaService } = require('./dist/database/prisma.service');
  console.log('✅ PrismaService imported successfully');
} catch (error) {
  console.log('❌ Failed to import PrismaService:', error.message);
}

// Test if we can import Auth service
try {
  const { AuthService } = require('./dist/auth/auth.service');
  console.log('✅ AuthService imported successfully');
} catch (error) {
  console.log('❌ Failed to import AuthService:', error.message);
}

console.log('Basic import tests completed.');
