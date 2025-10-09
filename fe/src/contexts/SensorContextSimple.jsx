import React, { createContext, useContext, useState, useEffect } from 'react';

const SensorContext = createContext();

export const useSensor = () => {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error('useSensor must be used within a SensorProvider');
  }
  return context;
};

export const SensorProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState({
    temperature: { value: 25, unit: '°C', min: 0, max: 70 },
    humidity: { value: 65, unit: '%', min: 0, max: 100 },
    light: { value: 45, unit: '%', min: 0, max: 100 },
  });

  const [chartData, setChartData] = useState({
    temperature: [],
    humidity: [],
    light: []
  });

  const [isConnected, setIsConnected] = useState(true); // Fake connection

  // Tạo dữ liệu giả
  useEffect(() => {
    // Tạo dữ liệu chart ban đầu
    const initializeChartData = () => {
      const types = ['temperature', 'humidity', 'light'];
      const initialData = {};
      
      types.forEach(type => {
        const data = [];
        const baseTime = new Date();
        
        for (let i = 19; i >= 0; i--) {
          // Tạo thời gian với khoảng cách 30 giây để tránh trùng lặp
          const timestamp = new Date(baseTime.getTime() - i * 30 * 1000);
          const timeString = `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}:${timestamp.getSeconds().toString().padStart(2, '0')}`;
          
          let value;
          if (type === 'temperature') {
            value = Math.floor(Math.random() * 40) + 15; // 15-55°C
          } else if (type === 'humidity') {
            value = Math.floor(Math.random() * 50) + 30; // 30-80%
          } else {
            value = Math.floor(Math.random() * 80) + 10; // 10-90%
          }
          
          data.push({ 
            time: timeString, 
            value,
            timestamp: timestamp.getTime() // Lưu timestamp để đảm bảo unique
          });
        }
        initialData[type] = data;
      });
      
      setChartData(initialData);
    };

    initializeChartData();

    // Cập nhật dữ liệu mỗi 3 giây
    const interval = setInterval(() => {
      // Cập nhật sensor values
      setSensorData(prev => ({
        temperature: { ...prev.temperature, value: Math.floor(Math.random() * 40) + 15 },
        humidity: { ...prev.humidity, value: Math.floor(Math.random() * 50) + 30 },
        light: { ...prev.light, value: Math.floor(Math.random() * 80) + 10 },
      }));

      // Cập nhật chart data với timestamp unique
      const now = new Date();
      const timestamp = now.getTime();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      setChartData(prev => {
        const newData = {};
        
        Object.keys(prev).forEach(type => {
          const currentData = [...prev[type]];
          
          // Kiểm tra trùng lặp timestamp trước khi thêm
          const lastItem = currentData[currentData.length - 1];
          if (lastItem && lastItem.timestamp === timestamp) {
            // Nếu trùng timestamp, bỏ qua lần cập nhật này
            newData[type] = currentData;
            return;
          }
          
          // Xóa điểm cũ nhất nếu đã đủ 20 điểm
          if (currentData.length >= 20) {
            currentData.shift();
          }
          
          // Thêm điểm mới với timestamp unique
          let value;
          if (type === 'temperature') {
            value = Math.floor(Math.random() * 40) + 15;
          } else if (type === 'humidity') {
            value = Math.floor(Math.random() * 50) + 30;
          } else {
            value = Math.floor(Math.random() * 80) + 10;
          }
          
          currentData.push({ 
            time: timeString, 
            value,
            timestamp: timestamp 
          });
          newData[type] = currentData;
        });
        
        return newData;
      });
    }, 2000); // Cập nhật mỗi 2 giây

    return () => clearInterval(interval);
  }, []);

  const value = {
    sensorData,
    chartData,
    isConnected
  };

  return (
    <SensorContext.Provider value={value}>
      {children}
    </SensorContext.Provider>
  );
};