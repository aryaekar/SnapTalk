import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Camera, Edit3, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import { usersAPI, friendsAPI, postsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import EditProfileModal from '../components/EditProfileModal';
import toast from 'react-hot-toast';

function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const { data: profileData, isLoading: profileLoading } = useQuery(
    ['profile', id],
    () => usersAPI.getProfile(id),
    {
      enabled: !!id
    }
  );

  const { data: postsData, isLoading: postsLoading } = useQuery(
    ['userPosts', id],
    () => postsAPI.getUserPosts(id),
    {
      enabled: !!id
    }
  );

  const { data: friendsData } = useQuery(
    ['userFriends', id],
    () => friendsAPI.getFriends(),
    {
      enabled: id === currentUser?.id
    }
  );

  const uploadAvatarMutation = useMutation(
    (formData) => usersAPI.uploadAvatar(formData),
    {
      onSuccess: (response) => {
        const updatedUser = {
          ...currentUser,
          profilePicture: response.data.profilePicture
        };
        updateUser(updatedUser);
        queryClient.invalidateQueries(['profile', id]);
        toast.success('Profile picture updated!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to upload image');
      }
    }
  );

  const sendFriendRequestMutation = useMutation(
    (userId) => friendsAPI.sendRequest(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', id]);
        toast.success('Friend request sent!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send friend request');
      }
    }
  );

  const removeFriendMutation = useMutation(
    (userId) => friendsAPI.removeFriend(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', id]);
        toast.success('Friend removed');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove friend');
      }
    }
  );

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);
    uploadAvatarMutation.mutate(formData);
  };

  const handleSendFriendRequest = () => {
    sendFriendRequestMutation.mutate(id);
  };

  const handleRemoveFriend = () => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      removeFriendMutation.mutate(id);
    }
  };

  if (profileLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const profile = profileData?.data?.user;
  const posts = postsData?.data?.posts || [];
  const friends = friendsData?.data?.friends || [];
  const isOwnProfile = profileData?.data?.isOwnProfile;
  const isFriend = profileData?.data?.isFriend;

  if (!profile) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profile.profilePicture || `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=818cf8&color=ffffff&size=120`}
                alt={profile.firstName}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover"
              />
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.bio && (
                <p className="text-gray-600 mb-4">{profile.bio}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{posts.length} posts</span>
                <span>{profile.friends?.length || 0} friends</span>
                {profile.location && <span>{profile.location}</span>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {isOwnProfile ? (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn btn-outline"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <>
                  {isFriend ? (
                    <>
                      <button 
                        onClick={() => window.location.href = `/messages/${profile._id}`}
                        className="btn btn-primary"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </button>
                      <button
                        onClick={handleRemoveFriend}
                        className="btn btn-outline"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Remove Friend
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleSendFriendRequest}
                      className="btn btn-primary"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-3">
            <button
              onClick={() => setActiveTab('posts')}
              className={`btn ${activeTab === 'posts' ? 'btn-primary' : 'btn-outline'}`}
            >
              Posts
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('friends')}
                className={`btn ${activeTab === 'friends' ? 'btn-primary' : 'btn-outline'}`}
              >
                Friends
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {postsLoading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No posts yet
              </h3>
              <p className="text-gray-600">
                {isOwnProfile ? 'Start sharing your thoughts!' : `${profile.firstName} hasn't posted anything yet.`}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={currentUser}
                onLike={() => {}}
                onComment={() => {}}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'friends' && isOwnProfile && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <div key={friend._id} className="card">
              <div className="card-body">
                <div className="flex items-center space-x-3">
                  <img
                    src={friend.profilePicture || `https://ui-avatars.com/api/?name=${friend.firstName}+${friend.lastName}&background=3b82f6&color=fff`}
                    alt={friend.firstName}
                    className="avatar avatar-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {friend.firstName} {friend.lastName}
                    </h3>
                    {friend.bio && (
                      <p className="text-sm text-gray-600 truncate">{friend.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={profile}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updatedUser) => {
            updateUser(updatedUser);
            queryClient.invalidateQueries(['profile', id]);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}

export default Profile;
