const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/friends/request/:id
// @desc    Send friend request
// @access  Private
router.post('/request/:id', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a friend request to yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already friends
    if (currentUser.friends.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already friends with this user'
      });
    }

    // Check if request already sent
    const alreadySent = currentUser.sentFriendRequests.some(
      req => req.to.toString() === targetUserId
    );
    if (alreadySent) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent'
      });
    }

    // Check if request already received from target user
    const alreadyReceived = currentUser.friendRequests.some(
      req => req.from.toString() === targetUserId
    );
    if (alreadyReceived) {
      return res.status(400).json({
        success: false,
        message: 'This user has already sent you a friend request'
      });
    }

    // Atomic updates to avoid triggering validation
    await Promise.all([
      User.findByIdAndUpdate(currentUserId, {
        $push: { sentFriendRequests: { to: targetUserId, createdAt: new Date() } }
      }),
      User.findByIdAndUpdate(targetUserId, {
        $push: { friendRequests: { from: currentUserId, createdAt: new Date() } }
      })
    ]);

    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/friends/accept/:id
// @desc    Accept friend request
// @access  Private
router.post('/accept/:id', auth, async (req, res) => {
  try {
    const senderUserId = req.params.id;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    const senderUser = await User.findById(senderUserId);

    if (!senderUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if friend request exists
    const requestIndex = currentUser.friendRequests.findIndex(
      req => req.from.toString() === senderUserId
    );

    if (requestIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'No friend request found from this user'
      });
    }

    // Atomic updates: remove requests and add to friends
    await Promise.all([
      User.findByIdAndUpdate(currentUserId, {
        $pull: { friendRequests: { from: senderUserId } },
        $addToSet: { friends: senderUserId }
      }),
      User.findByIdAndUpdate(senderUserId, {
        $pull: { sentFriendRequests: { to: currentUserId } },
        $addToSet: { friends: currentUserId }
      })
    ]);

    res.json({
      success: true,
      message: 'Friend request accepted successfully'
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/friends/decline/:id
// @desc    Decline friend request
// @access  Private
router.post('/decline/:id', auth, async (req, res) => {
  try {
    const senderUserId = req.params.id;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    const senderUser = await User.findById(senderUserId);

    if (!senderUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if friend request exists
    const requestIndex = currentUser.friendRequests.findIndex(
      req => req.from.toString() === senderUserId
    );

    if (requestIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'No friend request found from this user'
      });
    }

    // Atomic updates: remove pending requests only
    await Promise.all([
      User.findByIdAndUpdate(currentUserId, {
        $pull: { friendRequests: { from: senderUserId } }
      }),
      User.findByIdAndUpdate(senderUserId, {
        $pull: { sentFriendRequests: { to: currentUserId } }
      })
    ]);

    res.json({
      success: true,
      message: 'Friend request declined'
    });
  } catch (error) {
    console.error('Decline friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/friends/:id
// @desc    Remove friend
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const friendUserId = req.params.id;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    const friendUser = await User.findById(friendUserId);

    if (!friendUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if they are friends
    if (!currentUser.friends.includes(friendUserId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not friends with this user'
      });
    }

    // Atomic updates: pull from both friend lists
    await Promise.all([
      User.findByIdAndUpdate(currentUserId, { $pull: { friends: friendUserId } }),
      User.findByIdAndUpdate(friendUserId, { $pull: { friends: currentUserId } })
    ]);

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/friends
// @desc    Get user's friends list
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'firstName lastName profilePicture isOnline lastSeen bio')
      .select('friends');

    res.json({
      success: true,
      friends: user.friends
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/friends/requests
// @desc    Get friend requests
// @access  Private
router.get('/requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friendRequests.from', 'firstName lastName profilePicture bio')
      .populate('sentFriendRequests.to', 'firstName lastName profilePicture bio')
      .select('friendRequests sentFriendRequests');

    res.json({
      success: true,
      received: user.friendRequests,
      sent: user.sentFriendRequests
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
