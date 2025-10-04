// Test file to verify device control API
import { deviceControlService } from '../services/deviceControlService';

// Test function to verify the API call
export const testDeviceControl = async () => {
  try {
    console.log('Testing device control API...');
    
    const testPayload = {
      device1: {
        device_id: 1,
        status: "ON" as const,
        user_id: 1,
        user_change: "Test User"
      },
      device2: {
        device_id: 2,
        status: "OFF" as const,
        user_id: 1,
        user_change: "Test User"
      },
      device3: {
        device_id: 3,
        status: "OFF" as const,
        user_id: 1,
        user_change: "Test User"
      }
    };
    
    const response = await deviceControlService.controlDevices(testPayload);
    console.log('API Test Success:', response);
    return response;
  } catch (error) {
    console.error('API Test Failed:', error);
    throw error;
  }
};

// Usage example in console:
// import { testDeviceControl } from './utils/testDeviceControl';
// testDeviceControl();