import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, User, Users, MessageCircle, Search, LogOut } from 'lucide-react';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Friends', href: '/friends', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageCircle },
    { name: 'Search', href: '/search', icon: Search },
  ];
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  useEffect(() => {
    const handler = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-xl font-bold text-gray-900">SnapTalk</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive(item.href)
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4 ">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpenMenu((v) => !v)}
                  className="user-chip flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-gray-100 focus:outline-none transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={openMenu}
                  title="User menu"
                >
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=818cf8&color=ffffff`}
                    alt={user?.firstName}
                  />
                  <span className="hidden md:block text-sm font-medium text-gray-300">
                    {user?.firstName} {user?.lastName}
                  </span>
                </button>

                {openMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-black border border-gray-200 rounded-lg shadow-lg w-48 z-50">
                    {/* caret */}
                    <div className="absolute -top-2 right-4 w-3 h-3 bg-black border-t border-l border-gray-200 rotate-45"></div>
                    <div className="py-1" role="menu" aria-label="User menu">
                      <Link
                        to={`/profile/${user?.id}`}
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-100"
                        onClick={() => setOpenMenu(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                      <button
                        onClick={() => { setOpenMenu(false); logout(); }}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 border-t border-gray-200">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-base font-medium ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

export default Layout;