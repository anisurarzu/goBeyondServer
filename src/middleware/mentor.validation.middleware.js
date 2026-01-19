const { body } = require('express-validator');

const createMentorValidation = [
  // User registration fields
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  // Mentor fields
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Bio must not exceed 2000 characters'),
  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Years of experience must be between 0 and 100'),
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Timezone must not exceed 100 characters'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  body('currency')
    .optional()
    .trim()
    .isLength({ min: 3, max: 10 })
    .withMessage('Currency must be between 3 and 10 characters'),
  body('image')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Image must not exceed 500 characters'),
  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array')
    .custom((languages) => {
      if (!Array.isArray(languages)) return false;
      
      for (const lang of languages) {
        if (!lang.code || typeof lang.code !== 'string') {
          throw new Error('Each language must have a code (e.g., "en", "de")');
        }
        if (!lang.language || typeof lang.language !== 'string') {
          throw new Error('Each language must have a language name (e.g., "English", "German")');
        }
        if (!lang.level || typeof lang.level !== 'string') {
          throw new Error('Each language must have a level (e.g., "Beginner", "Intermediate", "Advanced")');
        }
      }
      return true;
    })
    .withMessage('Languages must be an array of objects with "code", "language", and "level" fields'),
  body('isApproved')
    .optional()
    .isBoolean()
    .withMessage('isApproved must be a boolean'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const updateMentorValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Bio must not exceed 2000 characters'),
  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Years of experience must be between 0 and 100'),
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Timezone must not exceed 100 characters'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  body('currency')
    .optional()
    .trim()
    .isLength({ min: 3, max: 10 })
    .withMessage('Currency must be between 3 and 10 characters'),
  body('image')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Image must not exceed 500 characters'),
  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array')
    .custom((languages) => {
      if (!Array.isArray(languages)) return false;
      
      for (const lang of languages) {
        if (!lang.code || typeof lang.code !== 'string') {
          throw new Error('Each language must have a code (e.g., "en", "de")');
        }
        if (!lang.language || typeof lang.language !== 'string') {
          throw new Error('Each language must have a language name (e.g., "English", "German")');
        }
        if (!lang.level || typeof lang.level !== 'string') {
          throw new Error('Each language must have a level (e.g., "Beginner", "Intermediate", "Advanced")');
        }
      }
      return true;
    })
    .withMessage('Languages must be an array of objects with "code", "language", and "level" fields'),
  body('isApproved')
    .optional()
    .isBoolean()
    .withMessage('isApproved must be a boolean'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

module.exports = {
  createMentorValidation,
  updateMentorValidation
};
