import { apiClient } from './apiClient';
import type {
  User,
  ApiResponse,
} from '../types';

export const userService = {
  // Get all users
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<ApiResponse<User[]>>('/user/all');
    return response.data;
  },

  // Get user by ID
  async getUserById(id: number): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>(`/user/${id}`);
    return response.data;
  },

  // Update user
  async updateUser(id: number, user: Partial<{ name: string; email: string }>): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>(`/user/${id}`, user);
    return response.data;
  },

  // Delete user
  async deleteUser(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/user/${id}`);
    return response.data;
  },
};