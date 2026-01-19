const express = require('express');
const router = express.Router();
const {
  getAllMentors,
  getMentorById,
  getMentorByUserId,
  createMentor,
  updateMentor,
  deleteMentor,
  getMyMentorProfile,
  deleteMentorImage
} = require('../controllers/mentor.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  createMentorValidation,
  updateMentorValidation
} = require('../middleware/mentor.validation.middleware');

// Public routes
router.get('/', getAllMentors);
router.get('/:id', getMentorById);
router.get('/user/:userId', getMentorByUserId);

// Protected routes
router.get('/profile/me', authenticateToken, getMyMentorProfile);
router.post('/', createMentorValidation, createMentor); // Public - creates user and mentor
router.put('/:id', authenticateToken, updateMentorValidation, updateMentor);
router.delete('/:id', authenticateToken, deleteMentor);
router.delete('/profile/image', authenticateToken, deleteMentorImage);

module.exports = router;
