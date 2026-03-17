// Authentication utility functions
export const authAPI = {
  login: async (email, password) => {
    // Mock authentication - in production, this would call your backend
    if (email === 'admin@maggiethemua.com' && password === 'admin123') {
      const user = {
        id: 1,
        email: 'admin@maggiethemua.com',
        name: 'Maggie Admin',
        role: 'admin',
        permissions: ['manage_services', 'manage_appointments', 'manage_promotions', 'view_reports']
      };
      
      // Store in localStorage (in production, use secure HTTP-only cookies)
      localStorage.setItem('authToken', 'mock-admin-token');
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('loginTime', new Date().toISOString());
      
      return { 
        success: true, 
        data: { 
          user, 
          token: 'mock-admin-token' 
        } 
      };
    }
    
    throw new Error('Invalid email or password');
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
    
    // Check if token is expired (mock - in production, verify with backend)
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
      const loginDate = new Date(loginTime);
      const now = new Date();
      const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
      
      // Mock token expiration (24 hours)
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

  // Mock function to update user profile
  updateProfile: async (profileData) => {
    const user = authAPI.getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    
    const updatedUser = { ...user, ...profileData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return { success: true, data: { user: updatedUser } };
  }
};

export default authAPI;