import { apiClient } from './apiClient';
import type {
  SensorData,
  CreateSensorDataRequest,
  PaginatedResponse,
  ApiResponse,
} from '../types';

export const sensorService = {
  // Get all sensor data with pagination
  async getSensorData(page: number = 1, limit: number = 20): Promise<PaginatedResponse<SensorData>> {
    const response = await apiClient.get<PaginatedResponse<SensorData>>('/sensor-data', {
      page,
      limit,
    });
    return response.data;
  },

  // Get latest sensor data
  async getLatestSensorData(): Promise<SensorData> {
    const response = await apiClient.get<SensorData>('/sensor-data/latest');
    return response.data;
  },

  // Get sensor data by ID
  async getSensorDataById(id: number): Promise<SensorData> {
    const response = await apiClient.get<SensorData>(`/sensor-data/${id}`);
    return response.data;
  },

  // Create new sensor data
  async createSensorData(data: CreateSensorDataRequest): Promise<ApiResponse<SensorData>> {
    const response = await apiClient.post<ApiResponse<SensorData>>('/sensor-data', data);
    return response.data;
  },

  // Update sensor data
  async updateSensorData(id: number, data: Partial<CreateSensorDataRequest>): Promise<ApiResponse<SensorData>> {
    const response = await apiClient.put<ApiResponse<SensorData>>(`/sensor-data/${id}`, data);
    return response.data;
  },

  // Delete sensor data
  async deleteSensorData(id: number): Promise<ApiResponse<any>> {
    const response = await apiClient.delete<ApiResponse<any>>(`/sensor-data/${id}`);
    return response.data;
  },
};