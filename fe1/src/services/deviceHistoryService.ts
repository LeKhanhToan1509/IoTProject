import { apiClient } from './apiClient';
import type {
  DeviceHistory,
  CreateDeviceHistoryRequest,
  PaginatedResponse,
  ApiResponse,
} from '../types';

export const deviceHistoryService = {
  // Get all device histories with pagination
  async getDeviceHistories(page: number = 1, limit: number = 20): Promise<PaginatedResponse<DeviceHistory>> {
    const response = await apiClient.get<PaginatedResponse<DeviceHistory>>('/device-histories', {
      page,
      limit,
    });
    return response.data;
  },

  // Get device history by ID
  async getDeviceHistoryById(id: number): Promise<DeviceHistory> {
    const response = await apiClient.get<DeviceHistory>(`/device-histories/${id}`);
    return response.data;
  },

  // Get device history by device ID
  async getDeviceHistoryByDeviceId(deviceId: string): Promise<DeviceHistory[]> {
    const response = await apiClient.get<DeviceHistory[]>(`/device-histories/device/${deviceId}`);
    return response.data;
  },

  // Create new device history
  async createDeviceHistory(history: CreateDeviceHistoryRequest): Promise<ApiResponse<DeviceHistory>> {
    const response = await apiClient.post<ApiResponse<DeviceHistory>>('/device-histories', history);
    return response.data;
  },

  // Update device history
  async updateDeviceHistory(id: number, history: Partial<CreateDeviceHistoryRequest>): Promise<ApiResponse<DeviceHistory>> {
    const response = await apiClient.put<ApiResponse<DeviceHistory>>(`/device-histories/${id}`, history);
    return response.data;
  },

  // Delete device history
  async deleteDeviceHistory(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete<ApiResponse<any>>(`/device-histories/${id}`);
    return response.data;
  },
};