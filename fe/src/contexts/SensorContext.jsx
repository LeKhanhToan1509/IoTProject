import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSensor } from '../../features/sensor/hooks';

const SensorContext = createContext();

export const useSensorContext = () => {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error('useSensorContext must be used within a SensorProvider');
  }
  return context;
};

export const SensorProvider = ({ children, enabled = false }) => {
  const dispatch = useDispatch();
  const sensorHook = useSensor();
  const [wsConnection, setWsConnection] = useState(null);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // WebSocket connection for real-time updates - chỉ chạy khi enabled và authenticated
  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      console.log('🚫 SensorProvider: Skipping WebSocket connection - not enabled or not authenticated');
      return;
    }
    
    console.log('🚀 SensorProvider: Starting WebSocket connection...');
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:8080/ws');
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          sensorHook.updateConnectionStatus(true);
          setWsConnection(ws);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'sensor_data') {
              // Add real-time sensor data
              sensorHook.addNewSensorData({
                temperature: data.data.temperature,
                humidity: data.data.humidity,
                light: data.data.light,
                timestamp: data.data.timestamp || new Date().toISOString()
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          sensorHook.updateConnectionStatus(false);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          sensorHook.updateConnectionStatus(false);
          setWsConnection(null);
          
          // Reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        return ws;
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        sensorHook.updateConnectionStatus(false);
        return null;
      }
    };

    const ws = connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [enabled, isAuthenticated, sensorHook]);

  // Context value
  const contextValue = {
    // Sensor data từ Redux store
    sensorData: sensorHook.currentData,
    chartData: sensorHook.chartData,
    historicalData: sensorHook.historicalData,
    isConnected: sensorHook.isConnected,
    isLoading: sensorHook.isLoading,
    error: sensorHook.error,
    lastUpdated: sensorHook.lastUpdated,
    
    // Real-time data từ API polling
    lastSensorData: sensorHook.lastSensorData,
    allSensorData: sensorHook.allSensorData,
    
    // Actions
    updateCurrentData: sensorHook.updateCurrentData,
    updateHistoricalData: sensorHook.updateHistoricalData,
    clearError: sensorHook.clearSensorError,
    
    // RTK Query hooks for components to use directly
    useGetAllSensorData: sensorHook.useGetAllSensorData,
    useGetSensorDataById: sensorHook.useGetSensorDataById,
    useGetLastSensorData: sensorHook.useGetLastSensorData,
    useGetSensorDataByDateRange: sensorHook.useGetSensorDataByDateRange,
    
    // WebSocket connection status
    wsConnection,
  };

  return (
    <SensorContext.Provider value={contextValue}>
      {children}
    </SensorContext.Provider>
  );
};