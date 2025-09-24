import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { postsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import toast from 'react-hot-toast';

function Home() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const {
    data: feedData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['feed', page],
    () => postsAPI.getFeed(page),
    {
      keepPreviousData: true,
    }
  );

  const likePostMutation = useMutation(
    (postId) => postsAPI.likePost(postId),
    {
      onSuccess: (data, postId) => {
        // Update the post in the cache
        queryClient.setQueryData(['feed', page], (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            data: {
              ...oldData.data,
              posts: oldData.data.posts.map(post =>
                post._id === postId
                  ? {
                      ...post,
                      likes: data.data.likes,
                      likeCount: data.data.likeCount
                    }
                  : post
              )
            }
          };
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to like post');
      }
    }
  );

  const commentPostMutation = useMutation(
    ({ postId, content }) => postsAPI.commentPost(postId, content),
    {
      onSuccess: (data, { postId }) => {
        // Update the post in the cache
        queryClient.setQueryData(['feed', page], (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            data: {
              ...oldData.data,
              posts: oldData.data.posts.map(post =>
                post._id === postId
                  ? {
                      ...post,
                      comments: [...post.comments, data.data.comment],
                      commentCount: data.data.commentCount
                    }
                  : post
              )
            }
          };
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add comment');
      }
    }
  );

  const handleLike = (postId) => {
    likePostMutation.mutate(postId);
  };

  const handleComment = (postId, content) => {
    if (!content.trim()) return;
    commentPostMutation.mutate({ postId, content });
  };

  const handlePostCreated = () => {
    refetch();
  };

  if (isLoading && page === 1) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading feed: {error.response?.data?.message || 'Something went wrong'}</p>
        <button
          onClick={() => refetch()}
          className="btn btn-primary mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  const posts = feedData?.data?.posts || [];
  const pagination = feedData?.data?.pagination;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Create Post */}
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No posts to show
            </h3>
            <p className="text-gray-600">
              Start by creating your first post or adding some friends to see their posts here.
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              onLike={handleLike}
              onComment={handleComment}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center space-x-2 py-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline disabled:opacity-50"
          >
            Previous
          </button>
          <span className="flex items-center px-4 py-2 text-sm text-gray-700">
            Page {pagination.current} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= pagination.pages}
            className="btn btn-outline disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;
