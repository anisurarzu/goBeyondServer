const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  getActiveUsers,
  deleteImage
} = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
} = require('../middleware/validation.middleware');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfileValidation, updateProfile);
router.delete('/profile/image', authenticateToken, deleteImage);
router.post('/change-password', authenticateToken, changePasswordValidation, changePassword);
router.get('/active-users', authenticateToken, getActiveUsers);

module.exports = router;
