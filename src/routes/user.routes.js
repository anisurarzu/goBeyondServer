const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken
} = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
} = require('../middleware/validation.middleware');
const { uploadImage } = require('../middleware/upload.middleware');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, uploadImage, updateProfileValidation, updateProfile);
router.post('/change-password', authenticateToken, changePasswordValidation, changePassword);

module.exports = router;
