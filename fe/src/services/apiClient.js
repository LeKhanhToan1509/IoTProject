// API service utilities
import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:8080/api/v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Để gửi cookies với mỗi request
});

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Gọi refresh token API với cookies
        await axios.post(`${API_BASE_URL}/user/refresh-token`, {}, {
          withCredentials: true
        });
        
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem('authState');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

// Helper functions for auth management với cookies
export const authManager = {
  clearAuthState: () => {
    localStorage.removeItem('authState');
  },
  
  // Check if user is authenticated bằng cách kiểm tra cookies
  // Hoặc có thể call một API endpoint để verify
  isAuthenticated: () => {
    // Có thể check bằng cách call API hoặc check localStorage
    const authState = localStorage.getItem('authState');
    return !!authState;
  },
  
  // Logout bằng cách clear cookies
  logout: async () => {
    try {
      await apiClient.post('/user/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authState');
    }
  }
};