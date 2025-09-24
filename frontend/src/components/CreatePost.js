import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { Image, Video } from 'lucide-react';
import { postsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [privacy, setPrivacy] = useState('friends');
  const [isExpanded, setIsExpanded] = useState(false);

  const createPostMutation = useMutation(
    (formData) => postsAPI.createPost(formData),
    {
      onSuccess: () => {
        setContent('');
        setSelectedFiles([]);
        setIsExpanded(false);
        toast.success('Post created successfully!');
        onPostCreated?.();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create post');
      }
    }
  );

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Require text content regardless of selected media
    if (!content.trim()) {
      toast.error('Please add text to your post');
      return;
    }

    const formData = new FormData();
    formData.append('content', content);
    formData.append('privacy', privacy);
    
    selectedFiles.forEach(file => {
      formData.append('media', file);
    });

    createPostMutation.mutate(formData);
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex space-x-3">
          <img
            src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=818cf8&color=ffffff`}
            alt={user?.firstName}
            className="avatar avatar-md"
          />
          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                placeholder="What's on your mind?"
                className="w-full p-3 border-0 bg-gray-50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                rows={isExpanded ? 4 : 1}
              />

              {/* Inline validation message when content is required */}
              {isExpanded && !content.trim() && (
                <p className="mt-1 text-sm text-red-600">Text content is required to post.</p>
              )}

              {/* File Previews */}
              {selectedFiles.length > 0 && (
                <div className="mt-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={URL.createObjectURL(file)}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isExpanded && (
                <div className="mt-4">
                  {/* Privacy Selector */}
                  <div className="mb-4">
                    <select
                      value={privacy}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="px-3 py-2 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    >
                      <option value="public">🌍 Public</option>
                      <option value="friends">👥 Friends</option>
                      <option value="private">🔒 Only me</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <label className="cursor-pointer p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Image className="w-5 h-5" />
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      <label className="cursor-pointer p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Video className="w-5 h-5" />
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          setContent('');
                          setSelectedFiles([]);
                        }}
                        className="btn btn-outline"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createPostMutation.isLoading || !content.trim()}
                        title={!content.trim() ? 'Add text to your post' : ''}
                        className="btn btn-primary disabled:opacity-50"
                      >
                        {createPostMutation.isLoading ? (
                          <div className="spinner w-4 h-4"></div>
                        ) : (
                          'Post'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;
