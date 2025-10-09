import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux'; // Thêm import
import { addRealtimeData } from '../../features/sensor/sensorSlice'; 
import { useGetLastSensorDataQuery } from '../../features/sensor/sensorAPI';
import apiClient from './apiClients';

const WS_URL = 'ws://localhost:8080/ws';

export const useWebSocketSensor = () => {
  const dispatch = useDispatch(); // Dispatch cho Redux
  const [sensorData, setSensorData] = useState({
  });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    apiClient.get('/sensor/last').then(res => {
      const data = res.data.data;
      console.log("DATA", data);
      if (data) {
        setSensorData({
          temperature: { ...sensorData.temperature, value: parseFloat(data.Temperature) || 0 },
          humidity: { ...sensorData.humidity, value: parseFloat(data.Humidity) || 0 },
          light: { ...sensorData.light, value: parseFloat(data.Light) || 0 },
        });
      }
    }).catch(err => { console.error('Error fetching last sensor data:', err);
    });
  }, []);

  const { 
    data: lastSensorData, 
    isLoading: isLoadingFallback,
    error: fallbackError 
  } = useGetLastSensorDataQuery(undefined, { 
    refetchOnMountOrArgChange: true,
    pollingInterval: 0
  });

  // Hàm cập nhật local state VÀ dispatch Redux
  const updateSensorData = (temp, hum, light, timestamp = new Date().toISOString()) => {
    setSensorData(prev => ({
      temperature: { ...prev.temperature, value: temp },
      humidity: { ...prev.humidity, value: hum },
      light: { ...prev.light, value: light },
    }));
    dispatch(addRealtimeData({ temperature: temp, humidity: hum, light: light, timestamp }));
  };

  useEffect(() => {
    if (!isConnected && lastSensorData?.data && !isLoadingFallback) {
      const { temperature, humidity, light } = lastSensorData.data;
      updateSensorData(temperature, humidity, light);
      console.log('Fallback: Updated from API /last');
    }
    if (fallbackError) {
      console.error('Fallback API error:', fallbackError);
    }
  }, [lastSensorData, isLoadingFallback, fallbackError, isConnected, dispatch]);

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            console.log('Received sensor data from WS:', payload);

            const temp = parseFloat(payload.temperature) || sensorData.temperature.value;
            const hum = parseFloat(payload.humidity) || sensorData.humidity.value;
            const light = parseFloat(payload.light_raw)

            updateSensorData(temp, hum, light);
        } catch (error) {
            console.error('Error parsing WS data:', error);
        }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected - falling back to API');
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [dispatch]);

  return { 
    sensorData, 
    isConnected, 
    isLoading: isLoadingFallback, 
    error: fallbackError || null 
  };
};