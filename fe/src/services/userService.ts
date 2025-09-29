import { apiClient } from './apiClient';
import type {
  User,
  PaginatedResponse,
  ApiResponse,
} from '../types';

export const userService = {
  // Get all users with pagination
  async getUsers(page: number = 1, limit: number = 20): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<PaginatedResponse<User>>('/users', {
      page,
      limit,
    });
    return response.data;
  },

  // Get user by ID
  async getUserById(id: number): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  // Create new user
  async createUser(user: { name: string; email: string; password: string }): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>('/users', user);
    return response.data;
  },

  // Update user
  async updateUser(id: number, user: Partial<{ name: string; email: string }>): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, user);
    return response.data;
  },

  // Delete user
  async deleteUser(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete<ApiResponse<any>>(`/users/${id}`);
    return response.data;
  },
};