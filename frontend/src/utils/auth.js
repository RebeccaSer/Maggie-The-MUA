import { backendAuthAPI } from './api';

export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await backendAuthAPI.login({ email, password });
      const { user, token } = response.data.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('loginTime', new Date().toISOString());
      return { success: true, data: { user, token } };
    } catch (error) {
      const message = error.response?.data?.error || 'Invalid email or password';
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    window.location.href = '/admin/login';
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const user = authAPI.getCurrentUser();
    if (!token || !user) return false;
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
      const loginDate = new Date(loginTime);
      const now = new Date();
      const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        authAPI.logout();
        return false;
      }
    }
    return true;
  },

  hasPermission: (permission) => {
    const user = authAPI.getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  },

  updateProfile: async (profileData) => {
    try {
      const response = await backendAuthAPI.updateProfile(profileData);
      const updatedUser = response.data.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true, data: { user: updatedUser } };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  }
};

export default authAPI;