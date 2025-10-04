import { apiClient } from './apiClient';
import type {
  SensorData,
  BackendSensorData,
  ApiResponse,
} from '../types';

export const sensorService = {
  // Get all sensor data with pagination
  async getAllSensorData(page: number = 1, limit: number = 15): Promise<ApiResponse<BackendSensorData[]>> {
    const response = await apiClient.get<ApiResponse<BackendSensorData[]>>(`/sensor/all?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get sensor data by ID
  async getSensorDataById(id: number): Promise<ApiResponse<SensorData>> {
    const response = await apiClient.get<ApiResponse<SensorData>>(`/sensor/${id}`);
    return response.data;
  },

  // Get latest sensor data
  async getLatestSensorData(): Promise<ApiResponse<SensorData>> {
    const response = await apiClient.get<ApiResponse<SensorData>>('/sensor/last');
    return response.data;
  },
};