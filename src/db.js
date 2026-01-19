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
    
    // Add google_id column if it doesn't exist (for existing databases)
    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`;
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_key ON users(google_id) WHERE google_id IS NOT NULL`;
    } catch (error) {
      // Column might already exist, ignore error
      if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
        console.warn('Warning adding google_id column:', error.message);
      }
    }
    
    // Make password nullable if not already (for Google OAuth users)
    try {
      await prisma.$executeRaw`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`;
    } catch (error) {
      // Column might already be nullable, ignore error
      if (!error.message.includes('does not exist')) {
        console.warn('Warning updating password column:', error.message);
      }
    }
    
    // Create mentors table if it doesn't exist
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS mentors (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          bio TEXT,
          image VARCHAR(500),
          years_of_experience INTEGER,
          timezone VARCHAR(100),
          hourly_rate DECIMAL(10, 2),
          currency VARCHAR(10),
          languages JSONB,
          is_approved BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      // Create index on user_id if it doesn't exist
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS mentors_user_id_key ON mentors(user_id)
      `;
      
      // Create updated_at trigger function if it doesn't exist
      await prisma.$executeRaw`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `;
      
      // Create trigger for updated_at if it doesn't exist
      await prisma.$executeRaw`
        DROP TRIGGER IF EXISTS update_mentors_updated_at ON mentors;
        CREATE TRIGGER update_mentors_updated_at
        BEFORE UPDATE ON mentors
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `;
      
      console.log('✅ Mentors table created/verified');
    } catch (error) {
      // Table might already exist, check if it's a different error
      if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
        console.warn('Warning creating mentors table:', error.message);
      }
    }
    
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
