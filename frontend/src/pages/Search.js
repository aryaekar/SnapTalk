import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Search as SearchIcon, UserPlus } from 'lucide-react';
import { usersAPI, friendsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function Search() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: searchResults, isLoading } = useQuery(
    ['searchUsers', searchTerm],
    () => usersAPI.searchUsers(searchTerm),
    {
      enabled: searchTerm.length >= 2,
    }
  );

  const sendRequestMutation = useMutation(
    (userId) => friendsAPI.sendRequest(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['searchUsers', searchTerm]);
        toast.success('Friend request sent!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send request');
      }
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      setSearchTerm(searchQuery.trim());
    }
  };

  const handleSendRequest = (userId) => {
    sendRequestMutation.mutate(userId);
  };

  const users = searchResults?.data?.users || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search People</h1>
        <p className="text-gray-600">Find and connect with friends</p>
      </div>

      {/* Search Form */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={searchQuery.trim().length < 2}
            className="btn btn-primary disabled:opacity-50"
          >
            Search
          </button>
        </form>
        {searchQuery.length > 0 && searchQuery.length < 2 && (
          <p className="text-sm text-gray-500 mt-2">
            Please enter at least 2 characters to search
          </p>
        )}
      </div>

      {/* Search Results */}
      <div>
        {!searchTerm ? (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start searching for people
            </h3>
            <p className="text-gray-600">
              Enter a name or email to find friends and connections
            </p>
          </div>
        ) : isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-600">
              Try searching with different keywords
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Search Results ({users.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
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
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.bio && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {user._id !== currentUser.id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSendRequest(user._id)}
                          className="btn btn-primary btn-sm flex-1"
                          disabled={sendRequestMutation.isLoading}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Friend
                        </button>
                        <button 
                          onClick={() => window.location.href = `/profile/${user._id}`}
                          className="btn btn-outline btn-sm"
                        >
                          View Profile
                        </button>
                      </div>
                    )}
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

export default Search;
