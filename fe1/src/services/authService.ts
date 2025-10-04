import { apiClient } from './apiClient';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterOTPRequest,
  ApiResponse,
} from '../types';

export const authService = {
  // Request OTP for registration
  async registerOTP(data: RegisterOTPRequest): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>('/user/register/otp', data);
    return response.data;
  },

  // Register with OTP
  async register(data: RegisterRequest): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>('/user/register', data);
    return response.data;
  },

  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/user/login', credentials);
    return response.data;
  },

  // Logout (client-side only)
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};