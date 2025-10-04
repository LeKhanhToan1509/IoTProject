import { useEffect, useState, useCallback } from 'react';
import type { SensorData, BackendSensorData } from '../types';
import WebSocketManager from '../services/websocketManager';
import { sensorService } from '../services/sensorService';

export const useSensorWebSocket = () => {
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSensorData = useCallback((data: SensorData) => {
    console.log('useSensorWebSocket: Received sensor data:', data);
    
    setLatestData(data);
    setError(null);
    
    // Keep last 50 readings for history, maintain chronological order
    setHistory(prev => {
      // Add new data to the end and keep last 50 readings
      const newHistory = [...prev, data].slice(-50);
      console.log('useSensorWebSocket: History updated, total readings:', newHistory.length);
      return newHistory;
    });
  }, []);

  // Load initial historical data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('useSensorWebSocket: Loading initial sensor data...');
        setLoading(true);
        
        const response = await sensorService.getAllSensorData(1, 15);
        if (response.data) {
          // Transform API data to match our SensorData type
          const transformedData: SensorData[] = response.data.map((item: BackendSensorData) => ({
            ID: item.ID,
            CreatedAt: item.CreatedAt,
            UpdatedAt: item.UpdatedAt,
            temperature: item.Temperature,
            humidity: item.Humidity,
            light: item.Light,
          }));
          
          // Sort by creation time (oldest first) to maintain chronological order for chart display
          const sortedData = transformedData.sort((a, b) => 
            new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime()
          );
          
          setHistory(sortedData);
          
          // Set the latest data as the most recent reading (last in chronological order)
          if (sortedData.length > 0) {
            setLatestData(sortedData[sortedData.length - 1]);
          }
          
          console.log('useSensorWebSocket: Loaded', sortedData.length, 'initial readings');
        }
      } catch (err) {
        console.error('useSensorWebSocket: Failed to load initial data:', err);
        setError('Failed to load initial sensor data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    console.log('useSensorWebSocket: Setting up WebSocket connection');
    const wsManager = WebSocketManager.getInstance();
    
    // Add listener and get unsubscribe function
    const unsubscribe = wsManager.addListener(handleSensorData);
    
    // Update connection status periodically
    const checkConnection = () => {
      setConnected(wsManager.isConnected());
    };
    
    checkConnection();
    const intervalId = setInterval(checkConnection, 1000);

    // Cleanup on unmount
    return () => {
      console.log('useSensorWebSocket: Cleaning up');
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [handleSensorData]);

  return {
    latestData,
    history,
    connected,
    error,
    loading,
  };
};