import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Users, UserPlus, UserMinus, Check, X } from 'lucide-react';
import { friendsAPI, usersAPI } from '../utils/api';
import toast from 'react-hot-toast';

function Friends() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('friends');

  const { data: friendsData, isLoading: friendsLoading } = useQuery(
    'friends',
    friendsAPI.getFriends
  );

  const { data: requestsData, isLoading: requestsLoading } = useQuery(
    'friendRequests',
    friendsAPI.getRequests
  );

  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery(
    'friendSuggestions',
    usersAPI.getSuggestions
  );

  const acceptRequestMutation = useMutation(
    (userId) => friendsAPI.acceptRequest(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('friends');
        queryClient.invalidateQueries('friendRequests');
        toast.success('Friend request accepted!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to accept request');
      }
    }
  );

  const declineRequestMutation = useMutation(
    (userId) => friendsAPI.declineRequest(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('friendRequests');
        toast.success('Friend request declined');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to decline request');
      }
    }
  );

  const sendRequestMutation = useMutation(
    (userId) => friendsAPI.sendRequest(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('friendSuggestions');
        toast.success('Friend request sent!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send request');
      }
    }
  );

  const removeFriendMutation = useMutation(
    (userId) => friendsAPI.removeFriend(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('friends');
        toast.success('Friend removed');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove friend');
      }
    }
  );

  const handleAcceptRequest = (userId) => {
    acceptRequestMutation.mutate(userId);
  };

  const handleDeclineRequest = (userId) => {
    declineRequestMutation.mutate(userId);
  };

  const handleSendRequest = (userId) => {
    sendRequestMutation.mutate(userId);
  };

  const handleRemoveFriend = (userId, name) => {
    if (window.confirm(`Are you sure you want to remove ${name} from your friends?`)) {
      removeFriendMutation.mutate(userId);
    }
  };

  const friends = friendsData?.data?.friends || [];
  const receivedRequests = requestsData?.data?.received || [];
  const sentRequests = requestsData?.data?.sent || [];
  const suggestions = suggestionsData?.data?.suggestions || [];

  const tabs = [
    { id: 'friends', name: 'Friends', count: friends.length },
    { id: 'requests', name: 'Requests', count: receivedRequests.length },
    { id: 'suggestions', name: 'Suggestions', count: suggestions.length },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Friends</h1>
        <p className="text-gray-600">Manage your friends and connections</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn ${
                  activeTab === tab.id ? 'btn-primary' : 'btn-outline'
                }`}
              >
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Friends List */}
      {activeTab === 'friends' && (
        <div>
          {friendsLoading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No friends yet</h3>
              <p className="text-gray-600">Start connecting with people!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <div key={friend._id} className="card">
                  <div className="card-body">
                    <div className="flex items-center space-x-3 mb-4">
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
                        <div className="flex items-center mt-1">
                          <div className={`w-2 h-2 rounded-full mr-2 ${friend.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs text-gray-500">
                            {friend.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => window.location.href = `/messages/${friend._id}`}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        Message
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friend._id, `${friend.firstName} ${friend.lastName}`)}
                        className="btn btn-outline btn-sm"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friend Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Received Requests */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Received Requests ({receivedRequests.length})
            </h2>
            {requestsLoading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : receivedRequests.length === 0 ? (
              <p className="text-gray-600">No pending friend requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {receivedRequests.map((request) => (
                  <div key={request._id} className="card">
                    <div className="card-body">
                      <div className="flex items-center space-x-3 mb-4">
                        <img
                          src={request.from.profilePicture || `https://ui-avatars.com/api/?name=${request.from.firstName}+${request.from.lastName}&background=3b82f6&color=fff`}
                          alt={request.from.firstName}
                          className="avatar avatar-md"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {request.from.firstName} {request.from.lastName}
                          </h3>
                          {request.from.bio && (
                            <p className="text-sm text-gray-600 truncate">{request.from.bio}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(request.from._id)}
                          className="btn btn-primary btn-sm flex-1"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(request.from._id)}
                          className="btn btn-outline btn-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sent Requests ({sentRequests.length})
            </h2>
            {sentRequests.length === 0 ? (
              <p className="text-gray-600">No sent friend requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sentRequests.map((request) => (
                  <div key={request._id} className="card">
                    <div className="card-body">
                      <div className="flex items-center space-x-3">
                        <img
                          src={request.to.profilePicture || `https://ui-avatars.com/api/?name=${request.to.firstName}+${request.to.lastName}&background=3b82f6&color=fff`}
                          alt={request.to.firstName}
                          className="avatar avatar-md"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {request.to.firstName} {request.to.lastName}
                          </h3>
                          {request.to.bio && (
                            <p className="text-sm text-gray-600 truncate">{request.to.bio}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Request sent</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Friend Suggestions */}
      {activeTab === 'suggestions' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            People You May Know
          </h2>
          {suggestionsLoading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions</h3>
              <p className="text-gray-600">Check back later for new suggestions!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((user) => (
                <div key={user._id} className="card">
                  <div className="card-body">
                    <div className="flex items-center space-x-3 mb-4">
                      <img
                        src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=3b82f6&color=fff`}
                        alt={user.firstName}
                        className="avatar avatar-md"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h3>
                        {user.bio && (
                          <p className="text-sm text-gray-600 truncate">{user.bio}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(user._id)}
                      className="btn btn-primary btn-sm w-full"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Friends;
