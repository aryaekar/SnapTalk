import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { formatDistanceToNow } from 'date-fns';
import { Send, ArrowLeft } from 'lucide-react';
import { messagesAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

function Messages() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(userId || null);
  const messagesEndRef = useRef(null);

  // Get conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery(
    'conversations',
    messagesAPI.getConversations
  );

  // Get messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery(
    ['messages', selectedConversation],
    () => messagesAPI.getMessages(selectedConversation),
    {
      enabled: !!selectedConversation,
      refetchInterval: 5000, // Refetch every 5 seconds
    }
  );

  const sendMessageMutation = useMutation(
    (messageData) => messagesAPI.sendMessage(messageData),
    {
      onSuccess: () => {
        setMessage('');
        queryClient.invalidateQueries(['messages', selectedConversation]);
        queryClient.invalidateQueries('conversations');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
    }
  );

  // Real-time message handling
  useEffect(() => {
    if (socket) {
      socket.on('receiveMessage', (newMessage) => {
        // Update messages if the conversation is active
        if (newMessage.sender === selectedConversation || newMessage.receiver === selectedConversation) {
          queryClient.invalidateQueries(['messages', selectedConversation]);
        }
        // Update conversations list
        queryClient.invalidateQueries('conversations');
      });

      return () => {
        socket.off('receiveMessage');
      };
    }
  }, [socket, selectedConversation, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  // Set selected conversation from URL
  useEffect(() => {
    if (userId && userId !== selectedConversation) {
      setSelectedConversation(userId);
    }
  }, [userId, selectedConversation]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversation) return;

    const messageData = {
      receiver: selectedConversation,
      content: message.trim(),
    };

    sendMessageMutation.mutate(messageData);

    // Send via socket for real-time delivery
    if (socket) {
      socket.emit('sendMessage', {
        receiverId: selectedConversation,
        message: {
          ...messageData,
          sender: currentUser.id,
          createdAt: new Date().toISOString(),
        }
      });
    }
  };

  const handleConversationSelect = (conversationUserId) => {
    setSelectedConversation(conversationUserId);
    navigate(`/messages/${conversationUserId}`);
  };

  const conversations = conversationsData?.data?.conversations || [];
  const messages = messagesData?.data?.messages || [];
  const selectedUser = conversations.find(conv => conv._id === selectedConversation)?.user;

  return (
    <div className="h-[calc(100vh-12rem)] max-w-6xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex h-full">
        {/* Conversations Sidebar */}
        <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {conversationsLoading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-gray-600">No conversations yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Start a conversation by visiting someone's profile
                </p>
              </div>
            ) : (
              <div>
                {conversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    onClick={() => handleConversationSelect(conversation._id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation === conversation._id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={conversation.user.profilePicture || `https://ui-avatars.com/api/?name=${conversation.user.firstName}+${conversation.user.lastName}&background=3b82f6&color=fff`}
                          alt={conversation.user.firstName}
                          className="avatar avatar-md"
                        />
                        {conversation.user.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conversation.user.firstName} {conversation.user.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-block bg-blue-600 text-white text-xs rounded-full px-2 py-1 mt-1">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center space-x-3 flex-shrink-0">
                <button
                  onClick={() => {
                    setSelectedConversation(null);
                    navigate('/messages');
                  }}
                  className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {selectedUser && (
                  <>
                    <img
                      src={selectedUser.profilePicture || `https://ui-avatars.com/api/?name=${selectedUser.firstName}+${selectedUser.lastName}&background=3b82f6&color=fff`}
                      alt={selectedUser.firstName}
                      className="avatar avatar-md"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedUser.isOnline ? 'Online' : `Last seen ${formatDistanceToNow(new Date(selectedUser.lastSeen), { addSuffix: true })}`}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messagesLoading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No messages yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Start the conversation!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${msg.sender._id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                            msg.sender._id === currentUser.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender._id === currentUser.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <form onSubmit={handleSendMessage} className="flex items-center">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full px-4 py-3 pr-12 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                        autoComplete="off"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!message.trim() || sendMessageMutation.isLoading}
                        className="absolute right-1 p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {sendMessageMutation.isLoading ? (
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;
