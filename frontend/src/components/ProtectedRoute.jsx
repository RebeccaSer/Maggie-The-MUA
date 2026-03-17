import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authAPI } from '../utils/auth';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const location = useLocation();
  
  if (!authAPI.isAuthenticated()) {
    // Redirect to login page with return url
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (requireAdmin) {
    const user = authAPI.getCurrentUser();
    if (user?.role !== 'admin') {
      // Redirect to home if not admin
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;