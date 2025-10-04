import { useState, useEffect } from 'react';
import { deviceService } from '../services/deviceService';
import type { Device } from '../types';

export const useDevices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('useDevices: Fetching devices...');
      const response = await deviceService.getAllDevices();
      console.log('useDevices: Devices response:', response);
      setDevices(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('useDevices: Failed to fetch devices:', error);
      setError(error.message || 'Failed to fetch devices');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshDevices = () => {
    fetchDevices();
  };

  // Get current device status as a map
  const getDeviceStatusMap = (): { [key: number]: 'ON' | 'OFF' } => {
    const statusMap: { [key: number]: 'ON' | 'OFF' } = {};
    devices.forEach(device => {
      if (device.ID && device.ID <= 3) {
        statusMap[device.ID] = device.status;
      }
    });
    return statusMap;
  };

  // Get fake devices if no real devices are available
  const getDisplayDevices = (): Array<Device & { isFake?: boolean }> => {
    if (devices.length > 0) {
      return devices.slice(0, 3);
    }
    
    // Return fake data for demo
    return [
      { ID: 1, name: 'Light 1', status: 'OFF', isFake: true, CreatedAt: '', UpdatedAt: '' },
      { ID: 2, name: 'Light 2', status: 'OFF', isFake: true, CreatedAt: '', UpdatedAt: '' },
      { ID: 3, name: 'Light 3', status: 'ON', isFake: true, CreatedAt: '', UpdatedAt: '' }
    ] as Array<Device & { isFake?: boolean }>;
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return {
    devices,
    loading,
    error,
    refreshDevices,
    getDeviceStatusMap,
    getDisplayDevices
  };
};