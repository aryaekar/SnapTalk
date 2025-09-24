const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { uploadMedia, uploadToCloudinary, deleteFromCloudinary, handleUploadErrors } = require('../utils/cloudinary');

const router = express.Router();

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', 
  auth, 
  (req, res, next) => {
    uploadMedia(req, res, function(err) {
      if (err) {
        return handleUploadErrors(err, req, res, next);
      }
      next();
    });
  },
  [
  // Allow either text content or at least one uploaded media file
  body('content').custom((value, { req }) => {
    const hasText = typeof value === 'string' && value.trim().length > 0;
    const hasFiles = Array.isArray(req.files) && req.files.length > 0;
    if (!hasText && !hasFiles) {
      throw new Error('Add text or at least one media file');
    }
    if (hasText && value.trim().length > 2000) {
      throw new Error('Post content cannot exceed 2000 characters');
    }
    return true;
  })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation errors',
        errors: errors.array() 
      });
    }

    try {
      const { content, taggedUsers, privacy = 'friends' } = req.body;
      // Persist uploaded files into schema-aligned fields
      const images = [];
      const videos = [];

      // Handle media uploads
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            const result = await uploadToCloudinary(file.buffer, {
              resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
              folder: `snaptalk/posts/${req.user.id}`
            });

            if (file.mimetype.startsWith('video/')) {
              videos.push({
                url: result.secure_url,
                publicId: result.public_id
              });
            } else {
              images.push({
                url: result.secure_url,
                publicId: result.public_id
              });
            }
          } catch (uploadError) {
            console.error('Media upload error:', uploadError);
            // If one file fails, delete any successfully uploaded files
            if (images.length > 0 || videos.length > 0) {
              const uploaded = [...images, ...videos];
              await Promise.all(uploaded.map(item => deleteFromCloudinary(item.publicId)));
            }
            return res.status(400).json({
              success: false,
              message: uploadError.message || 'Error uploading media files'
            });
          }
        }
      }

      const post = new Post({
        author: req.user.id,
        content,
        images,
        videos,
        privacy
      });

      // Handle tagged users
      if (taggedUsers) {
        const taggedUserIds = Array.isArray(taggedUsers) ? taggedUsers : [taggedUsers];
        post.taggedUsers = taggedUserIds;
      }

      await post.save();

      // Populate author information
      await post.populate('author', 'firstName lastName profilePicture');
      await post.populate('taggedUsers', 'firstName lastName profilePicture');

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        post
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   GET /api/posts/feed
// @desc    Get news feed posts
// @access  Private
router.get('/feed', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user.id);
    const friendIds = currentUser.friends;

    // Get posts from friends and own posts
    const posts = await Post.find({
      $or: [
        { author: req.user.id },
        { 
          author: { $in: friendIds },
          privacy: { $in: ['public', 'friends'] }
        }
      ]
    })
    .populate('author', 'firstName lastName profilePicture')
    .populate('taggedUsers', 'firstName lastName profilePicture')
    .populate('likes.user', 'firstName lastName profilePicture')
    .populate('comments.user', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

    const total = await Post.countDocuments({
      $or: [
        { author: req.user.id },
        { 
          author: { $in: friendIds },
          privacy: { $in: ['public', 'friends'] }
        }
      ]
    });

    res.json({
      success: true,
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get posts by specific user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.params.userId;

    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check privacy permissions
    const isFriend = currentUser.friends.includes(userId);
    const isOwnProfile = userId === req.user.id;

    let privacyFilter = {};
    if (isOwnProfile) {
      // Own posts - show all
      privacyFilter = {};
    } else if (isFriend) {
      // Friend's posts - show public and friends
      privacyFilter = { privacy: { $in: ['public', 'friends'] } };
    } else {
      // Non-friend - show only public
      privacyFilter = { privacy: 'public' };
    }

    const posts = await Post.find({
      author: userId,
      ...privacyFilter
    })
    .populate('author', 'firstName lastName profilePicture')
    .populate('taggedUsers', 'firstName lastName profilePicture')
    .populate('likes.user', 'firstName lastName profilePicture')
    .populate('comments.user', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

    const total = await Post.countDocuments({
      author: userId,
      ...privacyFilter
    });

    res.json({
      success: true,
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like/unlike a post
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const likeIndex = post.likes.findIndex(
      like => like.user.toString() === req.user.id
    );

    if (likeIndex > -1) {
      // Unlike the post
      post.likes.splice(likeIndex, 1);
    } else {
      // Like the post
      post.likes.push({
        user: req.user.id,
        createdAt: new Date()
      });
    }

    await post.save();
    await post.populate('likes.user', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      likes: post.likes,
      likeCount: post.likeCount
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/posts/:id/comment
// @desc    Add comment to post
// @access  Private
router.post('/:id/comment', auth, [
  body('content').trim().notEmpty().withMessage('Comment content is required')
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
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

    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = {
      user: req.user.id,
      content,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    await post.populate('comments.user', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: post.comments[post.comments.length - 1],
      commentCount: post.commentCount
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Delete media files from Cloudinary
    const mediaToDelete = [...post.images, ...post.videos];
    for (const media of mediaToDelete) {
      try {
        await deleteFromCloudinary(media.publicId);
      } catch (deleteError) {
        console.error('Error deleting media:', deleteError);
      }
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
