import { apiClient } from './apiClient';

interface DeviceControlRequest {
  device1: {
    device_id: number;
    status: 'ON' | 'OFF';
    user_id: number;
    user_change: string;
  };
  device2: {
    device_id: number;
    status: 'ON' | 'OFF';
    user_id: number;
    user_change: string;
  };
  device3: {
    device_id: number;
    status: 'ON' | 'OFF';
    user_id: number;
    user_change: string;
  };
}

interface DeviceControlResponse {
  message: string;
  data?: any;
}

export const deviceControlService = {
  controlDevices: async (payload: DeviceControlRequest): Promise<DeviceControlResponse> => {
    try {
      console.log('DeviceControlService: Sending control request:', payload);
      const response = await apiClient.post<DeviceControlResponse>('/device/control', payload);
      console.log('DeviceControlService: Control response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('DeviceControlService: Control failed:', error);
      throw error;
    }
  },

  toggleDevice: async (
    deviceId: number, 
    currentStatus: 'ON' | 'OFF', 
    userId: number, 
    userName: string,
    allDevicesStatus?: { [key: number]: 'ON' | 'OFF' }
  ): Promise<DeviceControlResponse> => {
    const newStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
    
    console.log('toggleDevice payload preparation:', { deviceId, newStatus, allDevicesStatus });
    
    // Create payload for all devices, maintain current status for others
    const payload: DeviceControlRequest = {
      device1: {
        device_id: 1,
        status: deviceId === 1 ? newStatus : (allDevicesStatus?.[1] || 'OFF'),
        user_id: userId,
        user_change: userName
      },
      device2: {
        device_id: 2,
        status: deviceId === 2 ? newStatus : (allDevicesStatus?.[2] || 'OFF'),
        user_id: userId,
        user_change: userName
      },
      device3: {
        device_id: 3,
        status: deviceId === 3 ? newStatus : (allDevicesStatus?.[3] || 'OFF'),
        user_id: userId,
        user_change: userName
      }
    };
    
    console.log('Final payload:', payload);

    return deviceControlService.controlDevices(payload);
  }
};