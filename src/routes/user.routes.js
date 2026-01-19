const express = require('express');
const router = express.Router();
const passport = require('../middleware/google.auth.middleware');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  getActiveUsers,
  deleteImage,
  googleCallback
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

// Google OAuth routes (only if credentials are configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/error' }),
    googleCallback
  );
} else {
  // Return error if Google OAuth is not configured
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.'
    });
  });
  router.get('/google/callback', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured.'
    });
  });
}
router.get('/google/error', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Google authentication failed'
  });
});

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfileValidation, updateProfile);
router.delete('/profile/image', authenticateToken, deleteImage);
router.post('/change-password', authenticateToken, changePasswordValidation, changePassword);
router.get('/active-users', authenticateToken, getActiveUsers);

module.exports = router;
