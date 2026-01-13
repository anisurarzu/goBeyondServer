const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { prisma } = require('../db');
const { generateToken, generateRefreshToken } = require('../utils/jwt.utils');

// Register a new user
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format errors for better readability
      const formattedErrors = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));
      
      console.log('Validation errors:', formattedErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors: formattedErrors
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.createdAt
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors: formattedErrors
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last_active timestamp on login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() }
    });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user profile (protected route)
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        image: true,
        birthdate: true,
        profession: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Format user data - image is already a full URL
    const userData = {
      ...user,
      first_name: user.firstName,
      last_name: user.lastName,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };

    res.json({
      success: true,
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user profile (protected route)
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors: formattedErrors
      });
    }

    const { firstName, lastName, birthdate, profession, name, image } = req.body;
    
    // Build update data object
    const updateData = {};

    // Handle image URL (accept as string URL)
    if (image !== undefined) {
      if (image === null || image === '') {
        // Allow setting image to null to delete it
        updateData.image = null;
      } else {
        updateData.image = image.trim();
      }
    }

    // Handle other fields
    if (firstName !== undefined) {
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      updateData.lastName = lastName.trim();
    }

    if (birthdate !== undefined && birthdate !== null && birthdate !== '') {
      updateData.birthdate = new Date(birthdate);
    }

    if (profession !== undefined) {
      updateData.profession = profession.trim();
    }

    // Keep name field for backward compatibility
    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Update user with Prisma
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        image: true,
        birthdate: true,
        profession: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Format user data for response
    const userData = {
      ...user,
      first_name: user.firstName,
      last_name: user.lastName,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };

    // Return image URL as-is (already a full URL or null)
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change password (protected route)
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors: formattedErrors
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { password: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== 'refresh') {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new tokens
    const newToken = generateToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all active/logged-in users (protected route)
const getActiveUsers = async (req, res) => {
  try {
    // Default: users active in the last 15 minutes
    const activeMinutes = parseInt(req.query.minutes) || 15;
    
    // Calculate the timestamp threshold
    const threshold = new Date(Date.now() - activeMinutes * 60 * 1000);
    
    // Find active users with Prisma
    const activeUsers = await prisma.user.findMany({
      where: {
        lastActive: {
          not: null,
          gte: threshold
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        image: true,
        profession: true,
        lastActive: true,
        createdAt: true
      },
      orderBy: {
        lastActive: 'desc'
      }
    });

    // Format users with full image URLs
    const users = activeUsers.map(user => {
      const formattedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        first_name: user.firstName,
        last_name: user.lastName,
        image: user.image,
        profession: user.profession,
        last_active: user.lastActive,
        created_at: user.createdAt
      };
      
      // Image is already a full URL, return as-is
      return formattedUser;
    });

    res.json({
      success: true,
      message: `Found ${users.length} active user(s)`,
      data: {
        users: users,
        count: users.length,
        activeWithinMinutes: activeMinutes
      }
    });
  } catch (error) {
    console.error('Get active users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete user image (protected route)
const deleteImage = async (req, res) => {
  try {
    // Update user to set image to null
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { image: null },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        image: true,
        birthdate: true,
        profession: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Format user data for response
    const userData = {
      ...user,
      first_name: user.firstName,
      last_name: user.lastName,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  getActiveUsers,
  deleteImage
};
