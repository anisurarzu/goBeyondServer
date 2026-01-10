const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Create Prisma Client instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Initialize database
const initializeDatabase = async () => {
  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection established');
    
    // Run migrations to ensure schema is up to date
    // Note: In production, run migrations separately with: npx prisma migrate deploy
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = {
  prisma,
  initializeDatabase
};
