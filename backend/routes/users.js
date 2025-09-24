const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { uploadImage, uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

const router = express.Router();

// @route   GET /api/users/profile/:id
// @desc    Get user profile by ID
// @access  Private
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('friends', 'firstName lastName profilePicture isOnline')
      .populate('friendRequests.from', 'firstName lastName profilePicture')
      .populate('sentFriendRequests.to', 'firstName lastName profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if the requesting user is a friend or the same user
    const isFriend = user.friends.some(friend => friend._id.toString() === req.user.id);
    const isOwnProfile = user._id.toString() === req.user.id;

    // Hide sensitive information if not a friend or own profile
    let userData = user.toJSON();
    if (!isFriend && !isOwnProfile) {
      delete userData.email;
      delete userData.friendRequests;
      delete userData.sentFriendRequests;
    }

    res.json({
      success: true,
      user: userData,
      isFriend,
      isOwnProfile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('location').optional().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { firstName, lastName, bio, location, dateOfBirth } = req.body;
    
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (bio !== undefined) updateFields.bio = bio;
    if (location !== undefined) updateFields.location = location;
    if (dateOfBirth) updateFields.dateOfBirth = dateOfBirth;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/upload-avatar
// @desc    Upload profile picture
// @access  Private
router.post('/upload-avatar', auth, uploadImage.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const user = await User.findById(req.user.id);

    // Delete old profile picture if exists
    if (user.profilePicture) {
      try {
        // Extract public ID from URL
        const publicId = user.profilePicture.split('/').pop().split('.')[0];
        await deleteFromCloudinary(`snaptalk/${publicId}`);
      } catch (deleteError) {
        console.error('Error deleting old avatar:', deleteError);
      }
    }

    // Upload new image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'snaptalk/avatars',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' }
      ]
    });

    // Update user profile picture
    user.profilePicture = result.secure_url;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePicture: result.secure_url
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during image upload'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users by name or email
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const skip = (page - 1) * limit;

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.id } }, // Exclude current user
        {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex }
          ]
        }
      ]
    })
    .select('firstName lastName email profilePicture bio')
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ firstName: 1 });

    const total = await User.countDocuments({
      $and: [
        { _id: { $ne: req.user.id } },
        {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex }
          ]
        }
      ]
    });

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/suggestions
// @desc    Get friend suggestions
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const friendIds = currentUser.friends;
    const sentRequestIds = currentUser.sentFriendRequests.map(req => req.to);
    const receivedRequestIds = currentUser.friendRequests.map(req => req.from);

    // Get users who are not friends and haven't been sent/received friend requests
    const suggestions = await User.find({
      _id: {
        $nin: [
          req.user.id,
          ...friendIds,
          ...sentRequestIds,
          ...receivedRequestIds
        ]
      }
    })
    .select('firstName lastName profilePicture bio')
    .limit(5)
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
