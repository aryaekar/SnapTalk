import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { X } from 'lucide-react';
import { usersAPI } from '../utils/api';
import toast from 'react-hot-toast';

function EditProfileModal({ user, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    bio: user.bio || '',
    location: user.location || '',
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
  });

  const updateProfileMutation = useMutation(
    (userData) => usersAPI.updateProfile(userData),
    {
      onSuccess: (response) => {
        toast.success('Profile updated successfully!');
        onUpdate(response.data.user);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  return (
    // The overlay and centering container are styled correctly.
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="card-header flex items-center justify-between">
        <h2 className="text-xl font-semibold">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body with Form */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="card-body space-y-4 overflow-y-auto">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Bio */}
          <div className="card-body space-y-4 overflow-y-auto">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Location */}
          <div className="card-body space-y-4 overflow-y-auto">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="City, Country"
            />
          </div>

          {/* Date of Birth */}
          <div className="card-body space-y-4 overflow-y-auto">
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </form>

        {/* Modal Footer with Buttons */}
        <div className="card-footer flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit} // Added to trigger form submit from footer
            disabled={updateProfileMutation.isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateProfileMutation.isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;