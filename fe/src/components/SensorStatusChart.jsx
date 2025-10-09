import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import apiClient from '../hooks/apiClients';  
const { Title } = Typography;

const SensorStatusChart = ({ type = 'temperature' }) => { 
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef(null);

  const config = useMemo(() => {
    const sensorConfig = {
      temperature: { 
        title: 'Temperature Status', 
        unit: '°C', 
        minValue: 20, 
        maxValue: 50,
        highlightColor: '#1890ff'
      },
      humidity: { 
        title: 'Humidity Status', 
        unit: '%', 
        minValue: 30, 
        maxValue: 80,
        highlightColor: '#52c41a'
      },
      light: { 
        title: 'Light Status', 
        unit: 'lux', 
        minValue: 0, 
        maxValue: 3000,
        highlightColor: '#faad14'
      },
    };
    return sensorConfig[type] || sensorConfig.temperature;
  }, [type]);

  // Fetch initial 20 data từ API
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/sensor/all?page=1&limit=20');
        const result = response.data;
        console.log("result", result);
        const dataArray = result.data || [];

        if (dataArray.length > 0) {
          // Sort ASC theo CreatedAt (cũ nhất đầu)
          const sortedData = dataArray.sort((a, b) => new Date(a.CreatedAt) - new Date(b.CreatedAt));

          // Transform dựa trên type
          const transformedData = sortedData.map((item) => {
            const time = new Date(item.CreatedAt).toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });

            let value = 0;
            if (type === 'temperature') value = parseFloat(item.Temperature) || 0;
            if (type === 'humidity') value = parseFloat(item.Humidity) || 0;
            if (type === 'light') value = parseFloat(item.Light) || 0; // Raw lux

            return {
              time,
              value,
              timestamp: item.CreatedAt
            };
          });

          setChartData(transformedData.slice(0, 20));
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [type]);
  console.log("chartData", chartData);
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('Received WS data:', payload);

        // Chỉ update nếu payload có sensor data
        if (payload.temperature !== undefined || payload.humidity !== undefined || payload.light_raw !== undefined) {
          const now = new Date();
          const lastItem = chartData[chartData.length - 1];
          let newTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          if (lastItem) {
            const lastTime = new Date(lastItem.timestamp);
            const newTimestamp = new Date(lastTime.getTime() + 2 * 60 * 1000); // +2 phút
            newTime = newTimestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          }

          let newValue = 0;
          if (type === 'temperature') newValue = parseFloat(payload.temperature) || 0;
          if (type === 'humidity') newValue = parseFloat(payload.humidity) || 0;
          if (type === 'light') newValue = parseFloat(payload.light_raw) || 0;

          const newPoint = {
            time: newTime,
            value: newValue,
            timestamp: now.toISOString()
          };

          // Thêm cuối, xóa đầu nếu >20
          setChartData(prev => {
            const updated = [...prev, newPoint];
            return updated.length > 20 ? updated.slice(1) : updated;
          });
        }
      } catch (error) {
        console.error('Error parsing WS data:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [type, chartData.length]); // Reconnect nếu type thay đổi

  // Log data
  console.log(`Chart Data for ${type}:`, chartData);

  if (isLoading || chartData.length === 0) {
    return (
      <Card 
        style={{ 
          height: '400px', 
          borderRadius: 8, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography.Text>Đang tải dữ liệu lịch sử...</Typography.Text>
      </Card>
    );
  }

  return (
    <Card 
      styles={{
        body: { padding: 0 }
      }}
      style={{ 
        height: '400px', 
        borderRadius: 8, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={5} style={{ margin: 0, color: '#1890ff' }}>{config.title}</Title>
      </div>
      <div style={{ flex: 1, padding: '16px', minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            barCategoryGap="10%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10 }} 
              angle={-45} 
              textAnchor="end"
              height={60}
              interval={Math.ceil(chartData.length / 10)}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              domain={[Math.max(0, config.minValue - 5), config.maxValue + 5]}
              label={{ value: config.unit, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value) => [`${value}${config.unit}`, config.title]}
              labelStyle={{ color: '#666' }}
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: '6px'
              }}
            />
            <Bar 
              dataKey="value" 
              barSize={18}
              radius={[3, 3, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === chartData.length - 1 ? config.highlightColor : '#e6f7ff'} 
                  stroke={index === chartData.length - 1 ? config.highlightColor : '#d9d9d9'}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default SensorStatusChart;