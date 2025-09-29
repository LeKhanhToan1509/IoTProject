import { apiClient } from './apiClient';
import type {
  Device,
  CreateDeviceRequest,
  UpdateDeviceStatusRequest,
  ApiResponse,
} from '../types';

export const deviceService = {
  // Get all devices
  async getDevices(): Promise<Device[]> {
    const response = await apiClient.get<Device[]>('/devices');
    return response.data;
  },

  // Get device by ID
  async getDeviceById(id: number): Promise<Device> {
    const response = await apiClient.get<Device>(`/devices/${id}`);
    return response.data;
  },

  // Get device by device ID
  async getDeviceByDeviceId(deviceId: string): Promise<Device> {
    const response = await apiClient.get<Device>(`/devices/device/${deviceId}`);
    return response.data;
  },

  // Create new device
  async createDevice(device: CreateDeviceRequest): Promise<ApiResponse<Device>> {
    const response = await apiClient.post<ApiResponse<Device>>('/devices', device);
    return response.data;
  },

  // Update device status
  async updateDeviceStatus(deviceId: string, status: UpdateDeviceStatusRequest): Promise<ApiResponse<Device>> {
    const response = await apiClient.put<ApiResponse<Device>>(`/devices/device/${deviceId}/status`, status);
    return response.data;
  },

  // Delete device
  async deleteDevice(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete<ApiResponse<any>>(`/devices/${id}`);
    return response.data;
  },
};