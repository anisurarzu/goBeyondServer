const { Pool } = require('pg');
require('dotenv').config();

// Parse connection string and ensure proper format
let connectionString = process.env.DATABASE_URL;

// If the hostname doesn't have a domain, try to add common Render PostgreSQL domains
if (connectionString && !connectionString.includes('.')) {
  // Check if hostname is missing domain (common Render issue)
  const hostnameMatch = connectionString.match(/@([^:/\s]+)/);
  if (hostnameMatch && !hostnameMatch[1].includes('.')) {
    console.warn('⚠️  Warning: Hostname appears incomplete. Please verify your connection string from Render dashboard.');
  }
}

// Configure SSL - Render PostgreSQL requires SSL
// For Render and other cloud databases, SSL is typically required
const sslConfig = process.env.DB_SSL === 'false'
  ? false
  : { rejectUnauthorized: false }; // Required for Render PostgreSQL

const pool = new Pool({
  connectionString: connectionString,
  ssl: sslConfig,
  // Add connection timeout
  connectionTimeoutMillis: 10000,
  // Add query timeout
  query_timeout: 10000
});

// Test database connection
pool.on('connect', () => {
  // Connection event fires on each new connection, so we'll log it in initializeDatabase instead
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    
    // Test connection by running a simple query
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection established');
    
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        image VARCHAR(500),
        birthdate DATE,
        profession VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createUsersTable);
    
    // Add new columns if they don't exist (for existing databases)
    const alterTableQueries = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS image VARCHAR(500)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate DATE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS profession VARCHAR(255)`
    ];
    
    for (const query of alterTableQueries) {
      try {
        await pool.query(query);
      } catch (error) {
        // Column might already exist, ignore error
        if (!error.message.includes('already exists')) {
          console.warn('Warning adding column:', error.message);
        }
      }
    }
    
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase
};
