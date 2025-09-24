import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Messages from './pages/Messages';
import Search from './pages/Search';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

// Public Route component (redirects to home if logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/" /> : children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  } 
                />
                
                {/* Protected routes */}
                <Route 
                  path="/*" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/profile/:id" element={<Profile />} />
                          <Route path="/friends" element={<Friends />} />
                          <Route path="/messages" element={<Messages />} />
                          <Route path="/messages/:userId" element={<Messages />} />
                          <Route path="/search" element={<Search />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
              </Routes>
              
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </div>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
