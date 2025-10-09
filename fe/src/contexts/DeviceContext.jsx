import React, { createContext, useContext, useEffect } from 'react';
import { useDevice } from '../../features/device/hooks';

const DeviceContext = createContext();

export const useDeviceContext = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDeviceContext must be used within a DeviceProvider');
  }
  return context;
};

export const DeviceProvider = ({ children, enabled = false }) => {
  const deviceHook = useDevice();
  
  // Fetch all devices on mount - chỉ khi enabled
  const { data: devicesData, isLoading, error } = deviceHook.useGetAllDevices({
    skip: !enabled // Skip API call khi không enabled
  });

  // Context value
  const contextValue = {
    // Device data từ Redux store
    devices: deviceHook.devices,
    selectedDevice: deviceHook.selectedDevice,
    deviceHistory: deviceHook.deviceHistory,
    loading: deviceHook.loading || isLoading,
    error: deviceHook.error || error,
    lastUpdated: deviceHook.lastUpdated,
    
    // Real-time data từ API
    devicesData: devicesData?.data,
    
    // Actions
    createDevice: deviceHook.createDevice,
    updateDevice: deviceHook.updateDevice,
    deleteDevice: deviceHook.deleteDevice,
    controlDevice: deviceHook.controlDevice,
    controlMultipleDevices: deviceHook.controlMultipleDevices,
    selectDevice: deviceHook.selectDevice,
    
    // RTK Query hooks for components to use directly
    useGetAllDevices: deviceHook.useGetAllDevices,
    useGetDeviceById: deviceHook.useGetDeviceById,
  };

  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
    </DeviceContext.Provider>
  );
};