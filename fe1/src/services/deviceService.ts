import { apiClient } from './apiClient';
import type {
  Device,
  CreateDeviceRequest,
  ApiResponse,
} from '../types';

export const deviceService = {
  // Get all devices
  async getAllDevices(): Promise<ApiResponse<Device[]>> {
    const response = await apiClient.get<ApiResponse<Device[]>>('/device/all');
    return response.data;
  },

  // Get device by ID
  async getDeviceById(id: number): Promise<ApiResponse<Device>> {
    const response = await apiClient.get<ApiResponse<Device>>(`/device/${id}`);
    return response.data;
  },

  // Create new device
  async createDevice(device: CreateDeviceRequest): Promise<ApiResponse<Device>> {
    const response = await apiClient.post<ApiResponse<Device>>('/device/', device);
    return response.data;
  },

  // Update device
  async updateDevice(id: number, device: Partial<CreateDeviceRequest>): Promise<ApiResponse<Device>> {
    const response = await apiClient.put<ApiResponse<Device>>(`/device/${id}`, device);
    return response.data;
  },

  // Delete device
  async deleteDevice(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/device/${id}`);
    return response.data;
  },

  // Control device (DEPRECATED - use deviceControlService.toggleDevice instead)
  // Backend expects DevicesControlRequest format with all 3 devices
  async controlDevice(id: number, status: 'ON' | 'OFF', userId: number = 1, userName: string = 'User'): Promise<ApiResponse<null>> {
    // This is wrong format - backend expects DevicesControlRequest
    // Use deviceControlService.toggleDevice() instead
    const response = await apiClient.post<ApiResponse<null>>('/device/control', {
      device1: {
        device_id: 1,
        status: id === 1 ? status : 'OFF', // Default others to OFF if not specified
        user_id: userId,
        user_change: userName
      },
      device2: {
        device_id: 2, 
        status: id === 2 ? status : 'OFF',
        user_id: userId,
        user_change: userName
      },
      device3: {
        device_id: 3,
        status: id === 3 ? status : 'OFF', 
        user_id: userId,
        user_change: userName
      }
    });
    return response.data;
  },
};