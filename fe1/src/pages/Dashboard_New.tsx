import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  Lightbulb,
  Droplets,
  Sun,
  Wifi,
  WifiOff
} from 'lucide-react';
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
  const { devices, loading: devicesLoading, refreshDevices, getDeviceStatusMap, getDisplayDevices } = useDevices();
  
  const [loading, setLoading] = useState(true);
  const [controlLoading, setControlLoading] = useState<{ [key: number]: boolean }>({});
  const [selectedSensor, setSelectedSensor] = useState<'temperature' | 'humidity' | 'light'>('temperature');

  useEffect(() => {
    // Set loading to false once devices are loaded
    if (!devicesLoading) {
      setLoading(false);
    }
  }, [devicesLoading]);

  // Handle device control
  const handleDeviceToggle = async (deviceId: number, currentStatus: 'ON' | 'OFF') => {
    if (!isAuthenticated || !user) {
      console.error('User not authenticated');
      return;
    }

    try {
      setControlLoading(prev => ({ ...prev, [deviceId]: true }));
      
      // Get current status of all devices
      const deviceStatusMap = getDeviceStatusMap();
      
      // For devices not in the map, use the current status passed
      if (!deviceStatusMap[deviceId]) {
        deviceStatusMap[deviceId] = currentStatus;
      }
      
      console.log('Toggling device:', { deviceId, currentStatus, user: user.name, userId: user.ID });
      
      const response = await deviceControlService.toggleDevice(
        deviceId,
        currentStatus,
        user.ID || user.id || 1,
        user.name,
        deviceStatusMap
      );
      
      console.log('Device control response:', response);
      
      // Show success message (you can replace this with a toast notification)
      console.log(`✅ Device ${deviceId} successfully ${currentStatus === 'ON' ? 'turned OFF' : 'turned ON'}`);
      
      // Refresh devices after successful control
      refreshDevices();
      
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

  // Prepare chart data based on selected sensor
  // Ensure data is in proper chronological order and limit to last 15 entries
  const chartData = sensorData.length > 0 ? sensorData
    .slice(-15) // Take last 15 entries
    .map((data: any, index: number) => ({
      time: new Date(data.CreatedAt).toLocaleTimeString('vi-VN', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      temperature: data.temperature,
      humidity: data.humidity,
      light: data.light,
      index: index + 1 // Add index for better tracking
    })) : [];

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
    chartDataLength: chartData.length,
    hasLatestData: !!latestSensorData,
    devicesCount: devices.length,
    displayDevicesCount: getDisplayDevices().length,
    wsConnected,
    loading,
    wsLoading,
    devicesLoading,
    latestTime: latestSensorData ? new Date(latestSensorData.CreatedAt).toLocaleTimeString() : 'N/A',
    firstChartTime: chartData.length > 0 ? chartData[0].time : 'N/A',
    lastChartTime: chartData.length > 0 ? chartData[chartData.length - 1].time : 'N/A'
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
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${wsConnected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {wsConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            <div className="flex flex-col">
              <span className="text-xs font-semibold">{wsConnected ? 'Connected' : 'Disconnected'}</span>
              <span className="text-xs opacity-75">{sensorData.length} total / {chartData.length} showing</span>
            </div>
          </div>
          
          {/* User Info Panel */}
          {isAuthenticated && user && (
            <div className="bg-blue-800/20 border border-blue-600/30 rounded-lg px-4 py-2">
              <div className="text-xs text-blue-300">
                <div className="font-semibold">Logged in as:</div>
                <div>{user.name} (ID: {user.ID || user.id})</div>
                <div className="text-blue-400">{user.email}</div>
              </div>
            </div>
          )}
          
          {/* Debug Panel */}
          <div className="bg-gray-800/30 border border-gray-600/30 rounded-lg px-3 py-2">
            <div className="text-xs text-gray-400">
              <div>Latest: {latestSensorData ? new Date(latestSensorData.CreatedAt).toLocaleTimeString() : 'N/A'}</div>
              <div>Chart Range: {chartData.length > 0 ? `${chartData[0].time} → ${chartData[chartData.length - 1].time}` : 'No Data'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Cards - 3 Cards in a Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Temperature Card */}
        <div 
          onClick={() => setSelectedSensor('temperature')}
          className={`rounded-xl p-6 cursor-pointer transition-all duration-300 ${
            selectedSensor === 'temperature' 
              ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50 shadow-lg shadow-red-500/20' 
              : 'bg-gray-800/50 border border-gray-700/30 hover:border-red-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-red-500/20">
              <Thermometer className="h-6 w-6 text-red-400" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {latestSensorData?.temperature?.toFixed(1) || '0.0'}
              </div>
              <div className="text-sm text-gray-400">°C</div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-300">Temperature</div>
          <div className="mt-2 h-2 bg-gray-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-red-500 transition-all duration-500"
              style={{ width: `${Math.min(((latestSensorData?.temperature || 0) / 50) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Humidity Card */}
        <div 
          onClick={() => setSelectedSensor('humidity')}
          className={`rounded-xl p-6 cursor-pointer transition-all duration-300 ${
            selectedSensor === 'humidity' 
              ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border-2 border-teal-500/50 shadow-lg shadow-teal-500/20' 
              : 'bg-gray-800/50 border border-gray-700/30 hover:border-teal-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-teal-500/20">
              <Droplets className="h-6 w-6 text-teal-400" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {latestSensorData?.humidity?.toFixed(1) || '0.0'}
              </div>
              <div className="text-sm text-gray-400">%</div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-300">Humidity</div>
          <div className="mt-2 h-2 bg-gray-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-all duration-500"
              style={{ width: `${Math.min((latestSensorData?.humidity || 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Light Card */}
        <div 
          onClick={() => setSelectedSensor('light')}
          className={`rounded-xl p-6 cursor-pointer transition-all duration-300 ${
            selectedSensor === 'light' 
              ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20' 
              : 'bg-gray-800/50 border border-gray-700/30 hover:border-yellow-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-yellow-500/20">
              <Sun className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {latestSensorData?.light || 0}
              </div>
              <div className="text-sm text-gray-400">lux</div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-300">Light</div>
          <div className="mt-2 h-2 bg-gray-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
              style={{ width: `${Math.min(((latestSensorData?.light || 0) / 1000) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded-xl p-6 bg-gray-800/50 border border-gray-700/30 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white capitalize">{selectedSensor} Status</h3>
            
            {/* Time Filter Dropdown - Removed since we use real-time WebSocket data */}
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getSensorColor() }}></div>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id={`gradient-${selectedSensor}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={getSensorColor()} stopOpacity={0.9}/>
                    <stop offset="100%" stopColor={getSensorColor()} stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id={`gradient-hover-${selectedSensor}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95}/>
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.7}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#000000',
                    border: `2px solid ${getSensorColor()}`,
                    borderRadius: '8px',
                    boxShadow: `0 4px 12px ${getSensorColor()}40`
                  }}
                  itemStyle={{ color: '#FFFFFF' }}
                  cursor={{
                    fill: 'transparent',
                    stroke: getSensorColor(),
                    strokeWidth: 2
                  }}
                />
                <Bar 
                  dataKey={selectedSensor}
                  fill={`url(#gradient-${selectedSensor})`}
                  radius={[2, 2, 0, 0]}
                  name={`${selectedSensor.charAt(0).toUpperCase() + selectedSensor.slice(1)}`}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* DEVICES Section */}
      <div className="rounded-xl p-6" style={{ backgroundColor: '#1E1E1E' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white text-center flex-1">DEVICES</h3>
          {!isAuthenticated && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
              Login required to control devices
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          {getDisplayDevices().map((device, index) => (
            <div key={device.ID} className="text-center">
              <div className="flex flex-col items-center space-y-4">
                <Lightbulb className="h-8 w-8 text-gray-300" />
                <div>
                  <div className="text-white font-medium mb-1">{device.name || `Light ${index + 1}`}</div>
                    <div className="text-xs text-gray-400 mb-3">
                      {device.status === 'ON' ? '0.02W' : '0.00W'}
                      {controlLoading[device.ID || (index + 1)] && ' • Updating...'}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={device.status === 'ON'}
                        onChange={() => handleDeviceToggle(device.ID || (index + 1), device.status as 'ON' | 'OFF')}
                        disabled={controlLoading[device.ID || (index + 1)] || !isAuthenticated}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 ${
                        controlLoading[device.ID || (index + 1)] ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
                      }`} style={{ backgroundColor: device.status === 'ON' ? '#10B981' : '#404040' }}></div>
                      {controlLoading[device.ID || (index + 1)] && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;