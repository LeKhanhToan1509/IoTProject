import { apiClient } from './apiClient';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  ApiResponse,
} from '../types';

export const authService = {
  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>('/auth/register', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },

  async validateToken(): Promise<{ valid: boolean }> {
    const response = await apiClient.get<{ valid: boolean }>('/auth/validate');
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    const response = await apiClient.post<{ access_token: string }>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  async requestPasswordReset(email: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  async verifyEmail(email: string, code: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>('/auth/verify-email', {
      email,
      code,
    });
    return response.data;
  },

  async resendVerification(email: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post<ApiResponse<any>>('/auth/resend-verification', {
      email,
    });
    return response.data;
  },
};