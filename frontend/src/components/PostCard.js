import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from 'react-query';
import { postsAPI } from '../utils/api';
import toast from 'react-hot-toast';

function PostCard({ post, currentUser, onLike, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const queryClient = useQueryClient();

  const deletePostMutation = useMutation(
    (postId) => postsAPI.deletePost(postId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['feed']);
        toast.success('Post deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete post');
      }
    }
  );

  const isLiked = post.likes.some(like => like.user._id === currentUser.id);
  const isAuthor = post.author._id === currentUser.id;

  const handleLike = () => {
    onLike(post._id);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    onComment(post._id, commentText);
    setCommentText('');
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePostMutation.mutate(post._id);
    }
    setShowMenu(false);
  };

  return (
    <div className="card">
      {/* Post Header */}
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={post.author.profilePicture || `https://ui-avatars.com/api/?name=${post.author.firstName}+${post.author.lastName}&background=818cf8&color=ffffff`}
              alt={post.author.firstName}
              className="avatar avatar-md"
            />
            <div>
              <h3 className="font-semibold text-gray-900">
                {post.author.firstName} {post.author.lastName}
              </h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          {isAuthor && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <button
                    onClick={handleDelete}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card-body">
        {/* Content */}
        {post.content && (
          <div className="mb-4">
            <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
          </div>
        )}

        {/* Tags */}
        {post.taggedUsers && post.taggedUsers.length > 0 && (
          <div className="mb-4">
            <span className="text-sm text-gray-600">with </span>
            {post.taggedUsers.map((user, index) => (
              <span key={user._id} className="text-sm text-blue-600">
                {user.firstName} {user.lastName}
                {index < post.taggedUsers.length - 1 && ', '}
              </span>
            ))}
          </div>
        )}

        {/* Media */}
        {post.images && post.images.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-lg">
            <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {post.images.map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt=""
                  className="w-full h-64 object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {post.videos && post.videos.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-lg">
            {post.videos.map((video, index) => (
              <video
                key={index}
                src={video.url}
                controls
                className="w-full h-64"
              />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="py-2 border-t border-gray-200">
          <div className="grid grid-cols-2 text-sm text-gray-600">
            <div>
              {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
            </div>
            <div className="text-right">
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="py-2 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleLike}
              className={`btn btn-outline flex items-center justify-center space-x-2 ${
                isLiked ? 'text-red-600 bg-red-50' : ''
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>Like</span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="btn btn-outline flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Comment</span>
            </button>
            <button className="btn btn-outline flex items-center justify-center space-x-2">
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="border-t border-gray-200 pt-4">
            <form onSubmit={handleCommentSubmit} className="mb-4">
              <div className="flex space-x-3">
                <img
                  src={currentUser.profilePicture || `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}&background=818cf8&color=ffffff`}
                  alt={currentUser.firstName}
                  className="avatar avatar-sm"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="btn btn-primary btn-sm disabled:opacity-50"
                >
                  Post
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {post.comments.map((comment) => (
                <div key={comment._id} className="flex space-x-3">
                  <img
                    src={comment.user.profilePicture || `https://ui-avatars.com/api/?name=${comment.user.firstName}+${comment.user.lastName}&background=818cf8&color=ffffff`}
                    alt={comment.user.firstName}
                    className="avatar avatar-sm"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <h4 className="font-semibold text-sm text-gray-900">
                        {comment.user.firstName} {comment.user.lastName}
                      </h4>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostCard;
