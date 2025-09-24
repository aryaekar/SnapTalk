const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [2000, 'Post content cannot exceed 2000 characters']
  },
  images: [{
    url: String,
    publicId: String
  }],
  videos: [{
    url: String,
    publicId: String
  }],
  taggedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  privacy: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'friends'
  }
}, {
  timestamps: true
});

// Index for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ 'likes.user': 1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Ensure virtual fields are serialized
postSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Post', postSchema);
