const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { prisma } = require('../db');
const { generateToken, generateRefreshToken } = require('../utils/jwt.utils');

// Get all mentors (with optional filters)
const getAllMentors = async (req, res) => {
  try {
    const { 
      isApproved, 
      isActive, 
      language, 
      minRate, 
      maxRate,
      search 
    } = req.query;

    const where = {};

    // Filter by approval status
    if (isApproved !== undefined) {
      where.isApproved = isApproved === 'true';
    }

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Filter by hourly rate range
    if (minRate !== undefined || maxRate !== undefined) {
      where.hourlyRate = {};
      if (minRate !== undefined) {
        where.hourlyRate.gte = parseFloat(minRate);
      }
      if (maxRate !== undefined) {
        where.hourlyRate.lte = parseFloat(maxRate);
      }
    }

    // Note: Language filtering will be done after fetching (Prisma JSONB filtering is limited)
    // We'll filter in JavaScript after fetching

    // Search in title and bio
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } }
      ];
    }

    const mentors = await prisma.mentor.findMany({
      where,
      select: {
        id: true,
        userId: true,
        title: true,
        bio: true,
        image: true,
        yearsOfExperience: true,
        timezone: true,
        hourlyRate: true,
        currency: true,
        languages: true,
        isApproved: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            image: true,
            profession: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response and filter by language if specified
    let formattedMentors = mentors.map(mentor => {
      const formatted = {
        id: mentor.id,
        userId: mentor.userId,
        title: mentor.title,
        bio: mentor.bio,
        image: mentor.image,
        yearsOfExperience: mentor.yearsOfExperience,
        timezone: mentor.timezone,
        hourlyRate: mentor.hourlyRate ? parseFloat(mentor.hourlyRate) : null,
        currency: mentor.currency,
        languages: mentor.languages,
        isApproved: mentor.isApproved,
        isActive: mentor.isActive,
        createdAt: mentor.createdAt,
        updatedAt: mentor.updatedAt,
        user: mentor.user
      };
      
      return formatted;
    });

    // Filter by language if specified (filter in JavaScript)
    if (language) {
      formattedMentors = formattedMentors.filter(mentor => {
        if (!mentor.languages || !Array.isArray(mentor.languages)) return false;
        return mentor.languages.some(lang => 
          lang.code === language || 
          lang.language?.toLowerCase() === language.toLowerCase()
        );
      });
    }

    res.json({
      success: true,
      message: `Found ${formattedMentors.length} mentor(s)`,
      data: {
        mentors: formattedMentors,
        count: formattedMentors.length
      }
    });
  } catch (error) {
    console.error('Get all mentors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single mentor by ID
const getMentorById = async (req, res) => {
  try {
    const { id } = req.params;

    const mentor = await prisma.mentor.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        userId: true,
        title: true,
        bio: true,
        image: true,
        yearsOfExperience: true,
        timezone: true,
        hourlyRate: true,
        currency: true,
        languages: true,
        isApproved: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            image: true,
            profession: true
          }
        }
      }
    });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    const formattedMentor = {
      id: mentor.id,
      userId: mentor.userId,
      title: mentor.title,
      bio: mentor.bio,
      image: mentor.image,
      yearsOfExperience: mentor.yearsOfExperience,
      timezone: mentor.timezone,
      hourlyRate: mentor.hourlyRate ? parseFloat(mentor.hourlyRate) : null,
      currency: mentor.currency,
      languages: mentor.languages,
      isApproved: mentor.isApproved,
      isActive: mentor.isActive,
      createdAt: mentor.createdAt,
      updatedAt: mentor.updatedAt,
      user: mentor.user
    };

    // Return image URL as-is (already a full URL)
    res.json({
      success: true,
      data: {
        mentor: formattedMentor
      }
    });
  } catch (error) {
    console.error('Get mentor by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get mentor by user ID
const getMentorByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const mentor = await prisma.mentor.findUnique({
      where: { userId: parseInt(userId) },
      select: {
        id: true,
        userId: true,
        title: true,
        bio: true,
        image: true,
        yearsOfExperience: true,
        timezone: true,
        hourlyRate: true,
        currency: true,
        languages: true,
        isApproved: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            image: true,
            profession: true
          }
        }
      }
    });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    const formattedMentor = {
      id: mentor.id,
      userId: mentor.userId,
      title: mentor.title,
      bio: mentor.bio,
      image: mentor.image,
      yearsOfExperience: mentor.yearsOfExperience,
      timezone: mentor.timezone,
      hourlyRate: mentor.hourlyRate ? parseFloat(mentor.hourlyRate) : null,
      currency: mentor.currency,
      languages: mentor.languages,
      isApproved: mentor.isApproved,
      isActive: mentor.isActive,
      createdAt: mentor.createdAt,
      updatedAt: mentor.updatedAt,
      user: mentor.user
    };

    // Return image URL as-is (already a full URL)
    res.json({
      success: true,
      data: {
        mentor: formattedMentor
      }
    });
  } catch (error) {
    console.error('Get mentor by user ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create mentor with user registration (public - creates user and mentor profile)
const createMentor = async (req, res) => {
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

    const {
      // User registration fields
      email,
      password,
      name,
      // Mentor fields
      title,
      bio,
      image,
      yearsOfExperience,
      timezone,
      hourlyRate,
      currency,
      languages,
      isApproved,
      isActive
    } = req.body;

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

    // Create user and mentor profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name || null
        },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          image: true,
          profession: true,
          createdAt: true
        }
      });

      // Create mentor profile
      const mentor = await tx.mentor.create({
        data: {
          userId: user.id,
          title: title.trim(),
          bio: bio ? bio.trim() : null,
          image: image && image.trim() !== '' ? image.trim() : null,
          yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
          timezone: timezone ? timezone.trim() : null,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          currency: currency ? currency.trim() : null,
          languages: languages || null,
          isApproved: isApproved !== undefined ? isApproved : false,
          isActive: isActive !== undefined ? isActive : true
        }
      });

      return { user, mentor };
    });

    // Generate tokens
    const token = generateToken(result.user.id);
    const refreshToken = generateRefreshToken(result.user.id);

    const formattedMentor = {
      id: result.mentor.id,
      userId: result.mentor.userId,
      title: result.mentor.title,
      bio: result.mentor.bio,
      image: result.mentor.image,
      yearsOfExperience: result.mentor.yearsOfExperience,
      timezone: result.mentor.timezone,
      hourlyRate: result.mentor.hourlyRate ? parseFloat(result.mentor.hourlyRate) : null,
      currency: result.mentor.currency,
      languages: result.mentor.languages,
      isApproved: result.mentor.isApproved,
      isActive: result.mentor.isActive,
      createdAt: result.mentor.createdAt,
      updatedAt: result.mentor.updatedAt,
      user: result.user
    };

    res.status(201).json({
      success: true,
      message: 'Mentor profile and user account created successfully',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          image: result.user.image,
          profession: result.user.profession,
          created_at: result.user.createdAt
        },
        mentor: formattedMentor,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Create mentor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update mentor (protected - user can update their own, admin can update any)
const updateMentor = async (req, res) => {
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

    const { id } = req.params;
    const {
      title,
      bio,
      image,
      yearsOfExperience,
      timezone,
      hourlyRate,
      currency,
      languages,
      isApproved,
      isActive
    } = req.body;

    // Check if mentor exists
    const existingMentor = await prisma.mentor.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Check if user owns this mentor profile or is admin
    // For now, allow user to update their own profile
    // You can add admin check later
    if (existingMentor.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this mentor profile'
      });
    }

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (bio !== undefined) updateData.bio = bio ? bio.trim() : null;
    if (image !== undefined) {
      if (image === null || image === '') {
        updateData.image = null;
      } else {
        updateData.image = image.trim();
      }
    }
    if (yearsOfExperience !== undefined) updateData.yearsOfExperience = yearsOfExperience ? parseInt(yearsOfExperience) : null;
    if (timezone !== undefined) updateData.timezone = timezone ? timezone.trim() : null;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : null;
    if (currency !== undefined) updateData.currency = currency ? currency.trim() : null;
    if (languages !== undefined) updateData.languages = languages;
    // Only allow user to update isApproved if they're admin (add admin check later)
    // if (isApproved !== undefined) updateData.isApproved = isApproved;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update mentor
    const mentor = await prisma.mentor.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            image: true,
            profession: true
          }
        }
      }
    });

    const formattedMentor = {
      id: mentor.id,
      userId: mentor.userId,
      title: mentor.title,
      bio: mentor.bio,
      image: mentor.image,
      yearsOfExperience: mentor.yearsOfExperience,
      timezone: mentor.timezone,
      hourlyRate: mentor.hourlyRate ? parseFloat(mentor.hourlyRate) : null,
      currency: mentor.currency,
      languages: mentor.languages,
      isApproved: mentor.isApproved,
      isActive: mentor.isActive,
      createdAt: mentor.createdAt,
      updatedAt: mentor.updatedAt,
      user: mentor.user
    };

    // Return image URL as-is (already a full URL)
    res.json({
      success: true,
      message: 'Mentor profile updated successfully',
      data: {
        mentor: formattedMentor
      }
    });
  } catch (error) {
    console.error('Update mentor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete mentor (protected - user can delete their own, admin can delete any)
const deleteMentor = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if mentor exists
    const existingMentor = await prisma.mentor.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Check if user owns this mentor profile or is admin
    if (existingMentor.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this mentor profile'
      });
    }

    // Delete mentor (cascade will handle user relation)
    await prisma.mentor.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Mentor profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete mentor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user's mentor profile
const getMyMentorProfile = async (req, res) => {
  try {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: req.user.id },
      select: {
        id: true,
        userId: true,
        title: true,
        bio: true,
        image: true,
        yearsOfExperience: true,
        timezone: true,
        hourlyRate: true,
        currency: true,
        languages: true,
        isApproved: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            image: true,
            profession: true
          }
        }
      }
    });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'You do not have a mentor profile yet'
      });
    }

    const formattedMentor = {
      id: mentor.id,
      userId: mentor.userId,
      title: mentor.title,
      bio: mentor.bio,
      image: mentor.image,
      yearsOfExperience: mentor.yearsOfExperience,
      timezone: mentor.timezone,
      hourlyRate: mentor.hourlyRate ? parseFloat(mentor.hourlyRate) : null,
      currency: mentor.currency,
      languages: mentor.languages,
      isApproved: mentor.isApproved,
      isActive: mentor.isActive,
      createdAt: mentor.createdAt,
      updatedAt: mentor.updatedAt,
      user: mentor.user
    };

    // Return image URL as-is (already a full URL)
    res.json({
      success: true,
      data: {
        mentor: formattedMentor
      }
    });
  } catch (error) {
    console.error('Get my mentor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete mentor image
const deleteMentorImage = async (req, res) => {
  try {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: req.user.id }
    });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }

    if (!mentor.image) {
      return res.status(400).json({
        success: false,
        message: 'No image to delete'
      });
    }

    // Delete image from database
    await prisma.mentor.update({
      where: { userId: req.user.id },
      data: { image: null }
    });

    res.json({
      success: true,
      message: 'Mentor image deleted successfully'
    });
  } catch (error) {
    console.error('Delete mentor image error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllMentors,
  getMentorById,
  getMentorByUserId,
  createMentor,
  updateMentor,
  deleteMentor,
  getMyMentorProfile,
  deleteMentorImage
};
