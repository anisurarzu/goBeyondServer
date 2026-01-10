const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./db');
const userRoutes = require('./routes/user.routes');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS Configuration - Allow all origins in development
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization']
};

// Middleware - Apply CORS to all routes
app.use(cors(corsOptions));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle multer errors
  if (err instanceof require('multer').MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  
  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('\n🔄 Initializing server...');
    
    // Initialize database
    await initializeDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ SERVER STARTED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n📍 Available Endpoints:`);
      console.log(`   • Health Check:     GET  http://localhost:${PORT}/health`);
      console.log(`   • Register:         POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   • Login:            POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   • Get Profile:      GET  http://localhost:${PORT}/api/auth/profile`);
      console.log(`   • Update Profile:  PUT  http://localhost:${PORT}/api/auth/profile`);
      console.log(`   • Change Password: POST http://localhost:${PORT}/api/auth/change-password`);
      console.log(`   • Refresh Token:   POST http://localhost:${PORT}/api/auth/refresh-token`);
      console.log('\n' + '='.repeat(60));
      console.log('✨ Server is ready to accept requests!\n');
    });
  } catch (error) {
    console.error('\n❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
