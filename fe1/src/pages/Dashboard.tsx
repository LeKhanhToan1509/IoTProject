import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  Lightbulb,
  Droplets,
  Sun,
  Wifi,
  WifiOff
} from 'lucide-react';

// Add custom CSS for animations
const customStyles = `
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 8s linear infinite;
  }
`;

// Insert custom styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { deviceControlService } from '../services/deviceControlService';
import { useSensorWebSocket } from '../hooks/useSensorWebSocket';
import { useDevices } from '../hooks/useDevices';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard: React.FC = () => {
  // Use WebSocket for real-time sensor data
  const { latestData: latestSensorData, history: sensorData, connected: wsConnected, loading: wsLoading } = useSensorWebSocket();
  
  // User authentication
  const { user, isAuthenticated } = useAuth();
  
  // Device management
  const { devices, loading: devicesLoading, refreshDevices } = useDevices();
  
  const [loading, setLoading] = useState(true);
  const [controlLoading, setControlLoading] = useState<{ [key: number]: boolean }>({});
  const [savingToDb, setSavingToDb] = useState<{ [key: number]: boolean }>({});
  const [localDevices, setLocalDevices] = useState(devices);
  const [selectedSensor, setSelectedSensor] = useState<'temperature' | 'humidity' | 'light'>('temperature');

  useEffect(() => {
    // Chỉ sync khi không có operation nào đang chờ
    if (devices.length > 0 && Object.keys(controlLoading).every(key => !controlLoading[parseInt(key)])) {
      // Chỉ update initial load hoặc khi không có local changes
      if (localDevices.length === 0) {
        setLocalDevices(devices);
      }
    }
  }, [devices, controlLoading]);

  useEffect(() => {
    // Set loading to false once devices are loaded
    if (!devicesLoading) {
      setLoading(false);
    }
  }, [devicesLoading]);

  // Tạo displayDevices với đầy đủ 3 đèn, ưu tiên từ localDevices
  const displayDevices = (() => {
    const defaultDevices = [
      { ID: 1, name: 'Light 1', status: 'OFF', CreatedAt: '', UpdatedAt: '' },
      { ID: 2, name: 'Light 2', status: 'OFF', CreatedAt: '', UpdatedAt: '' },
      { ID: 3, name: 'Light 3', status: 'OFF', CreatedAt: '', UpdatedAt: '' }
    ];
    
    if (localDevices.length === 0) {
      return defaultDevices;
    }
    
    // Merge localDevices với defaultDevices để đảm bảo có đầy đủ 3 đèn
    return defaultDevices.map(defaultDevice => {
      const localDevice = localDevices.find(d => d.ID === defaultDevice.ID);
      return localDevice || defaultDevice;
    });
  })();

  // Handle device control
  const handleDeviceToggle = async (deviceId: number, currentStatus: 'ON' | 'OFF') => {
    if (!isAuthenticated || !user) {
      console.error('User not authenticated');
      return;
    }

    try {
      setControlLoading(prev => ({ ...prev, [deviceId]: true }));
      
      // Get current status từ localDevices để đảm bảo có trạng thái mới nhất
      const deviceStatusMap: { [key: number]: 'ON' | 'OFF' } = {};
      
      // Lấy trạng thái từ displayDevices
      displayDevices.forEach(device => {
        if (device.ID && device.ID <= 3) {
          deviceStatusMap[device.ID] = device.status as 'ON' | 'OFF';
        }
      });
      
      // Đảm bảo có status của device hiện tại
      if (!deviceStatusMap[deviceId]) {
        deviceStatusMap[deviceId] = currentStatus;
      }
      
      console.log('deviceStatusMap before API call:', deviceStatusMap);
      
      console.log('Toggling device:', { 
        deviceId, 
        currentStatus, 
        deviceStatusMap, 
        displayDevices: displayDevices.map(d => ({ id: d.ID, status: d.status })),
        user: user.name, 
        userId: user.ID 
      });
      
      // Gọi API trước khi update UI
      const response = await deviceControlService.toggleDevice(
        deviceId,
        currentStatus,
        user.ID || user.id || 1,
        user.name,
        deviceStatusMap
      );
      
      console.log('Device control response:', response);
      
      // Update local state sau khi API thành công
      const newStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
      
      // Update ngay lập tức để UI responsive
      setLocalDevices(prevDevices => 
        prevDevices.map(device => 
          device.ID === deviceId 
            ? { ...device, status: newStatus }
            : device
        )
      );
      
      // **SYNC VỚI DATABASE**: deviceControlService đã lưu trạng thái, chỉ cần refresh để sync
      setSavingToDb(prev => ({ ...prev, [deviceId]: true }));
      
      console.log(`� Syncing device ${deviceId} status with database...`);
      
      // Refresh devices từ database để lấy trạng thái mới nhất
      setTimeout(() => {
        console.log('� Refreshing devices from database to get latest status...');
        refreshDevices();
        setSavingToDb(prev => ({ ...prev, [deviceId]: false }));
      }, 1000);
      
      // Show success message
      console.log(`✅ Device ${deviceId} successfully ${currentStatus === 'ON' ? 'turned OFF' : 'turned ON'}`);
      
      // Không refresh devices ngay để tránh conflict với local state
      // Local state sẽ được giữ nguyên và database đã được cập nhật
      
    } catch (error: any) {
      console.error('❌ Failed to control device:', error);
      // Show error message
      alert(`Failed to control device: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setControlLoading(prev => ({ ...prev, [deviceId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#2A2A2A' }}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-white mt-4">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data - đơn giản hóa để đảm bảo có data
  const sortedSensorData = [...sensorData]
    .sort((a, b) => new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime());
    
  const chartData = sortedSensorData.length > 0 ? sortedSensorData
    .slice(-15) // Lấy 15 entries gần nhất
    .map((data: any, index: number) => ({
      time: new Date(data.CreatedAt).toLocaleTimeString('vi-VN', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit'
      }),
      temperature: Number(data.temperature) || 0,
      humidity: Number(data.humidity) || 0,
      light: Number(data.light) || 0,
      index: index + 1,
      fullTime: new Date(data.CreatedAt).toLocaleString('vi-VN')
    })) : 
    // Sample data for testing khi không có data thật
    Array.from({ length: 5 }, (_, i) => ({
      time: new Date(Date.now() - (4 - i) * 60000).toLocaleTimeString('vi-VN', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit'
      }),
      temperature: 20 + Math.random() * 10,
      humidity: 40 + Math.random() * 20,
      light: 100 + Math.random() * 400,
      index: i + 1,
      fullTime: new Date(Date.now() - (4 - i) * 60000).toLocaleString('vi-VN')
    }));

  const getSensorColor = () => {
    switch (selectedSensor) {
      case 'temperature': return '#FF6B6B';
      case 'humidity': return '#4ECDC4';
      case 'light': return '#FFE66D';
      default: return '#FF6B6B';
    }
  };

  console.log('Dashboard render - Data state:', {
    sensorDataLength: sensorData.length,
    sortedSensorDataLength: sortedSensorData.length,
    chartDataLength: chartData.length,
    hasLatestData: !!latestSensorData,
    selectedSensor,
    chartData: chartData.slice(0, 3), // Log first 3 items for debugging
    latestSensorValue: latestSensorData ? latestSensorData[selectedSensor] : 'N/A',
    wsConnected,
    loading: { wsLoading, devicesLoading, loading }
  });

  // Show loading spinner while loading initial data
  if (wsLoading || loading) {
    return (
      <div className="text-white min-h-screen flex items-center justify-center" style={{ backgroundColor: '#2A2A2A' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="text-white min-h-screen" style={{ backgroundColor: '#2A2A2A' }}>
      {/* Header with WebSocket Status */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time IoT Monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${wsConnected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {wsConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            <div>
              <div className="text-sm font-semibold">{wsConnected ? 'Live Connected' : 'Disconnected'}</div>
              <div className="text-xs opacity-75">{chartData.length} data points</div>
            </div>
          </div>
          
          {/* User Info Panel */}
          {isAuthenticated && user && (
            <div className="bg-blue-800/20 border border-blue-600/30 rounded-lg px-4 py-2">
              <div className="text-xs text-blue-300">
                <div className="font-semibold">{user.name}</div>
                <div className="text-blue-400">{user.email}</div>
              </div>
            </div>
          )}
          

        </div>
      </div>

      {/* Sensor Cards - 3 Cards siêu đẹp */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {/* Temperature Card - Siêu đẹp */}
        <div 
          onClick={() => setSelectedSensor('temperature')}
          className={`group rounded-2xl p-8 cursor-pointer transition-all duration-500 transform hover:scale-105 ${
            selectedSensor === 'temperature' 
              ? 'bg-gradient-to-br from-red-500/25 to-orange-500/25 border-2 border-red-400/60 shadow-2xl shadow-red-500/30' 
              : 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-600/40 hover:border-red-400/50 hover:shadow-xl hover:shadow-red-500/20'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className={`relative p-4 rounded-2xl transition-all duration-300 ${
              selectedSensor === 'temperature' ? 'bg-red-500/30 shadow-lg shadow-red-500/30' : 'bg-red-500/20 group-hover:bg-red-500/25'
            }`}>
              <Thermometer className={`h-8 w-8 transition-all duration-300 ${
                selectedSensor === 'temperature' ? 'text-red-300 drop-shadow-lg' : 'text-red-400 group-hover:text-red-300'
              }`} />
              {selectedSensor === 'temperature' && (
                <div className="absolute inset-0 rounded-2xl bg-red-400/20 animate-pulse"></div>
              )}
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold transition-all duration-300 ${
                selectedSensor === 'temperature' ? 'text-white drop-shadow-lg' : 'text-gray-100'
              }`}>
                {latestSensorData?.temperature?.toFixed(1) || '0.0'}
              </div>
              <div className="text-lg text-red-300 font-medium">°C</div>
            </div>
          </div>
          <div className="mb-4">
            <div className={`text-lg font-semibold transition-colors duration-300 ${
              selectedSensor === 'temperature' ? 'text-white' : 'text-gray-300 group-hover:text-white'
            }`}>Temperature</div>
            <div className="text-sm text-gray-400 mt-1">
              {(latestSensorData?.temperature || 0) > 30 ? '🔥 Hot' : (latestSensorData?.temperature || 0) > 20 ? '🌡️ Warm' : '❄️ Cool'}
            </div>
          </div>
          <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 via-green-400 to-red-500 transition-all duration-700 shadow-lg"
              style={{ width: `${Math.min(((latestSensorData?.temperature || 0) / 50) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Humidity Card - Siêu đẹp */}
        <div 
          onClick={() => setSelectedSensor('humidity')}
          className={`group rounded-2xl p-8 cursor-pointer transition-all duration-500 transform hover:scale-105 ${
            selectedSensor === 'humidity' 
              ? 'bg-gradient-to-br from-teal-500/25 to-cyan-500/25 border-2 border-teal-400/60 shadow-2xl shadow-teal-500/30' 
              : 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-600/40 hover:border-teal-400/50 hover:shadow-xl hover:shadow-teal-500/20'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className={`relative p-4 rounded-2xl transition-all duration-300 ${
              selectedSensor === 'humidity' ? 'bg-teal-500/30 shadow-lg shadow-teal-500/30' : 'bg-teal-500/20 group-hover:bg-teal-500/25'
            }`}>
              <Droplets className={`h-8 w-8 transition-all duration-300 ${
                selectedSensor === 'humidity' ? 'text-teal-300 drop-shadow-lg' : 'text-teal-400 group-hover:text-teal-300'
              }`} />
              {selectedSensor === 'humidity' && (
                <div className="absolute inset-0 rounded-2xl bg-teal-400/20 animate-pulse"></div>
              )}
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold transition-all duration-300 ${
                selectedSensor === 'humidity' ? 'text-white drop-shadow-lg' : 'text-gray-100'
              }`}>
                {latestSensorData?.humidity?.toFixed(1) || '0.0'}
              </div>
              <div className="text-lg text-teal-300 font-medium">%</div>
            </div>
          </div>
          <div className="mb-4">
            <div className={`text-lg font-semibold transition-colors duration-300 ${
              selectedSensor === 'humidity' ? 'text-white' : 'text-gray-300 group-hover:text-white'
            }`}>Humidity</div>
            <div className="text-sm text-gray-400 mt-1">
              {(latestSensorData?.humidity || 0) > 70 ? '💧 Humid' : (latestSensorData?.humidity || 0) > 40 ? '🌫️ Moderate' : '🌵 Dry'}
            </div>
          </div>
          <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-700 shadow-lg"
              style={{ width: `${Math.min((latestSensorData?.humidity || 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Light Card - Siêu đẹp */}
        <div 
          onClick={() => setSelectedSensor('light')}
          className={`group rounded-2xl p-8 cursor-pointer transition-all duration-500 transform hover:scale-105 ${
            selectedSensor === 'light' 
              ? 'bg-gradient-to-br from-yellow-500/25 to-orange-500/25 border-2 border-yellow-400/60 shadow-2xl shadow-yellow-500/30' 
              : 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-600/40 hover:border-yellow-400/50 hover:shadow-xl hover:shadow-yellow-500/20'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className={`relative p-4 rounded-2xl transition-all duration-300 ${
              selectedSensor === 'light' ? 'bg-yellow-500/30 shadow-lg shadow-yellow-500/30' : 'bg-yellow-500/20 group-hover:bg-yellow-500/25'
            }`}>
              <Sun className={`h-8 w-8 transition-all duration-300 ${
                selectedSensor === 'light' ? 'text-yellow-300 drop-shadow-lg animate-spin-slow' : 'text-yellow-400 group-hover:text-yellow-300'
              }`} />
              {selectedSensor === 'light' && (
                <div className="absolute inset-0 rounded-2xl bg-yellow-400/20 animate-pulse"></div>
              )}
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold transition-all duration-300 ${
                selectedSensor === 'light' ? 'text-white drop-shadow-lg' : 'text-gray-100'
              }`}>
                {latestSensorData?.light || 0}
              </div>
              <div className="text-lg text-yellow-300 font-medium">lux</div>
            </div>
          </div>
          <div className="mb-4">
            <div className={`text-lg font-semibold transition-colors duration-300 ${
              selectedSensor === 'light' ? 'text-white' : 'text-gray-300 group-hover:text-white'
            }`}>Light Intensity</div>
            <div className="text-sm text-gray-400 mt-1">
              {(latestSensorData?.light || 0) > 500 ? '☀️ Bright' : (latestSensorData?.light || 0) > 200 ? '🌤️ Moderate' : '🌙 Dim'}
            </div>
          </div>
          <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-700 shadow-lg"
              style={{ width: `${Math.min(((latestSensorData?.light || 0) / 1000) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chart Section với thiết kế siêu đẹp */}
      <div className="rounded-2xl p-8 bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-600/40 mb-8 backdrop-blur-md shadow-2xl hover:shadow-3xl transition-all duration-500">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <h3 className="text-2xl font-bold text-white capitalize bg-gradient-to-r from-white to-gray-300 bg-clip-text">
                  {selectedSensor} Analytics
                </h3>
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r opacity-60" style={{ background: `linear-gradient(90deg, ${getSensorColor()}, transparent)` }}></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="px-4 py-2 bg-gradient-to-r rounded-full text-sm font-medium text-white shadow-lg" 
                     style={{ background: `linear-gradient(135deg, ${getSensorColor()}20, ${getSensorColor()}40)`, border: `1px solid ${getSensorColor()}60` }}>
                  📊 {chartData.length} points
                </div>
                {latestSensorData && (
                  <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm font-medium text-blue-300">
                    Latest: {latestSensorData[selectedSensor]?.toFixed?.(1) || latestSensorData[selectedSensor]}
                    {selectedSensor === 'temperature' ? '°C' : selectedSensor === 'humidity' ? '%' : ' lux'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 rounded-full animate-pulse bg-green-400 shadow-lg shadow-green-400/50"></div>
                <span className="text-sm font-medium text-green-300">Live Data</span>
              </div>
              <div className="text-xs text-gray-400 bg-gray-700/30 px-3 py-2 rounded-lg">
                Updated {new Date().toLocaleTimeString('vi-VN')}
              </div>
            </div>
          </div>
          
          {chartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="text-6xl animate-bounce">📊</div>
                  <div className="absolute inset-0 animate-ping">
                    <div className="w-16 h-16 mx-auto rounded-full bg-blue-400/20"></div>
                  </div>
                </div>
                <div className="text-xl font-semibold text-white mb-3">Waiting for Data Stream</div>
                <div className="text-gray-400 mb-4">Your sensors will appear here in real-time</div>
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    wsConnected ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                    <span>WebSocket {wsConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                  <div className="bg-gray-700/30 text-gray-300 px-3 py-2 rounded-lg border border-gray-600/30">
                    📈 {sensorData.length} total entries
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 bg-gradient-to-br from-gray-900/30 to-gray-800/30 rounded-xl p-4 border border-gray-600/20">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 30, right: 40, left: 30, bottom: 60 }}>
                  <defs>
                    <linearGradient id={`gradient-${selectedSensor}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={getSensorColor()} stopOpacity={0.95}/>
                      <stop offset="50%" stopColor={getSensorColor()} stopOpacity={0.7}/>
                      <stop offset="100%" stopColor={getSensorColor()} stopOpacity={0.2}/>
                    </linearGradient>
                    <filter id={`glow-${selectedSensor}`}>
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/> 
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="#374151" strokeOpacity={0.6} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.95)',
                      border: `2px solid ${getSensorColor()}`,
                      borderRadius: '12px',
                      boxShadow: `0 8px 32px ${getSensorColor()}30`,
                      backdropFilter: 'blur(10px)'
                    }}
                    itemStyle={{ color: '#FFFFFF', fontWeight: 500 }}
                    labelStyle={{ color: getSensorColor(), fontWeight: 600 }}
                    formatter={(value: any, name: string) => [
                      `${value}${selectedSensor === 'temperature' ? '°C' : selectedSensor === 'humidity' ? '%' : ' lux'}`,
                      name.charAt(0).toUpperCase() + name.slice(1)
                    ]}
                    labelFormatter={(label: string, payload: any) => {
                      if (payload && payload[0] && payload[0].payload) {
                        return `Time: ${payload[0].payload.fullTime}`;
                      }
                      return `Time: ${label}`;
                    }}
                    cursor={{
                      fill: getSensorColor(),
                      fillOpacity: 0.1,
                      stroke: getSensorColor(),
                      strokeWidth: 2
                    }}
                  />
                  <Bar 
                    dataKey={selectedSensor}
                    fill={`url(#gradient-${selectedSensor})`}
                    radius={[6, 6, 0, 0]}
                    name={`${selectedSensor.charAt(0).toUpperCase() + selectedSensor.slice(1)}`}
                    maxBarSize={45}
                    minPointSize={3}
                    filter={`url(#glow-${selectedSensor})`}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
      </div>

      {/* DEVICES Section với thiết kế được cải thiện */}
      <div className="rounded-xl p-8 bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/40 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <h3 className="text-2xl font-bold text-white">DEVICE CONTROL</h3>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          {!isAuthenticated && (
            <div className="flex items-center space-x-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>Login required to control devices</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
          {displayDevices.map((device, index) => {
            const deviceId = device.ID || (index + 1);
            const isLoading = controlLoading[deviceId];
            const isDisabled = isLoading || !isAuthenticated;
            const isOn = device.status === 'ON';
            
            return (
              <div key={deviceId} className="text-center group">
                <div className={`bg-gray-800/60 rounded-2xl p-6 border transition-all duration-300 ${
                  isOn 
                    ? 'border-yellow-400/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 shadow-lg shadow-yellow-500/20' 
                    : 'border-gray-700/50 hover:border-gray-600/50'
                } ${isDisabled ? 'opacity-60' : 'hover:scale-[1.02]'}`}>
                  
                  {/* Device Icon với hiệu ứng sáng */}
                  <div className="relative mb-6">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                      isOn 
                        ? 'bg-yellow-400/20 shadow-lg shadow-yellow-400/30' 
                        : 'bg-gray-700/50'
                    }`}>
                      <Lightbulb className={`h-8 w-8 transition-all duration-300 ${
                        isOn 
                          ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
                          : 'text-gray-400'
                      }`} />
                    </div>
                    {isOn && (
                      <div className="absolute inset-0 rounded-full bg-yellow-400/10 animate-pulse"></div>
                    )}
                  </div>
                  
                  {/* Device Info */}
                  <div className="mb-6">
                    <h4 className="text-white font-semibold text-lg mb-2">
                      {device.name || `Smart Light ${index + 1}`}
                    </h4>
                    <div className={`text-sm transition-colors duration-300 ${
                      isOn ? 'text-yellow-300' : 'text-gray-400'
                    }`}>
                      <div className="font-medium">
                        {isOn ? '💡 ON' : '💤 OFF'} • {isOn ? '0.02W' : '0.00W'}
                      </div>
                      {isLoading && (
                        <div className="flex items-center justify-center mt-2 text-blue-400">
                          <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Controlling...
                        </div>
                      )}
                      {savingToDb[deviceId] && (
                        <div className="flex items-center justify-center mt-2 text-green-400">
                          <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                          � Syncing...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Toggle Switch với animation đẹp hơn */}
                  <div className="flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={() => handleDeviceToggle(deviceId, device.status as 'ON' | 'OFF')}
                        disabled={isDisabled}
                        className="sr-only peer"
                      />
                      <div className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'
                      } ${
                        isOn 
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-400/40' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}>
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-lg ${
                          isOn ? 'translate-x-7' : 'translate-x-0'
                        }`}>
                          {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="mt-4 flex justify-center">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                      isOn 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                    }`}>
                      {isOn ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Device Statistics */}
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {displayDevices.filter(d => d.status === 'ON').length}
            </div>
            <div className="text-xs text-gray-400">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {displayDevices.length}
            </div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {(displayDevices.filter(d => d.status === 'ON').length * 0.02).toFixed(2)}W
            </div>
            <div className="text-xs text-gray-400">Power</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;