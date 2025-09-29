import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  Lightbulb,
  Droplets,
  Sun
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
import { sensorService } from '../services/sensorService';
import { deviceService } from '../services/deviceService';
import LoadingSpinner from '../components/LoadingSpinner';
import type { SensorData, Device } from '../types';

const Dashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [latestSensorData, setLatestSensorData] = useState<SensorData | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState<'temperature' | 'humidity' | 'light'>('temperature');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorResponse, latestSensor, devicesResponse] = await Promise.all([
          sensorService.getSensorData(1, 20),
          sensorService.getLatestSensorData(),
          deviceService.getDevices(),
        ]);

        setSensorData(sensorResponse.data);
        setLatestSensorData(latestSensor);
        setDevices(devicesResponse);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Prepare chart data based on selected sensor
  const chartData = sensorData.length > 0 ? sensorData.map(data => ({
    time: new Date(data.CreatedAt).toLocaleTimeString(),
    temperature: data.temperature,
    humidity: data.humidity,
    light: data.light
  })) : [
    // FAKE DATA - Easy to remove later (Extended to 15 bars)
    { time: '06:00', temperature: 18, humidity: 70, light: 200 },
    { time: '07:00', temperature: 20, humidity: 68, light: 250 },
    { time: '08:00', temperature: 22, humidity: 65, light: 300 },
    { time: '09:00', temperature: 24, humidity: 62, light: 450 },
    { time: '10:00', temperature: 26, humidity: 58, light: 600 },
    { time: '11:00', temperature: 28, humidity: 55, light: 750 },
    { time: '12:00', temperature: 30, humidity: 52, light: 850 },
    { time: '13:00', temperature: 32, humidity: 48, light: 900 },
    { time: '14:00', temperature: 29, humidity: 51, light: 820 },
    { time: '15:00', temperature: 27, humidity: 54, light: 720 },
    { time: '16:00', temperature: 25, humidity: 57, light: 580 },
    { time: '17:00', temperature: 23, humidity: 60, light: 400 },
    { time: '18:00', temperature: 21, humidity: 63, light: 320 },
    { time: '19:00', temperature: 20, humidity: 66, light: 280 },
    { time: '20:00', temperature: 19, humidity: 69, light: 220 }
  ];

  const getCurrentValue = () => {
    if (!latestSensorData) {
      // FAKE DATA - Easy to remove later
      switch (selectedSensor) {
        case 'temperature': return 24;
        case 'humidity': return 65;
        case 'light': return 450;
        default: return 0;
      }
    }
    switch (selectedSensor) {
      case 'temperature': return latestSensorData.temperature;
      case 'humidity': return latestSensorData.humidity;
      case 'light': return latestSensorData.light;
      default: return 0;
    }
  };

  const getCurrentUnit = () => {
    switch (selectedSensor) {
      case 'temperature': return '°C';
      case 'humidity': return '%';
      case 'light': return ' lux';
      default: return '';
    }
  };

  const getSensorIcon = () => {
    switch (selectedSensor) {
      case 'temperature': return <Thermometer className="h-5 w-5 text-white" />;
      case 'humidity': return <Droplets className="h-5 w-5 text-white" />;
      case 'light': return <Sun className="h-5 w-5 text-white" />;
      default: return <Thermometer className="h-5 w-5 text-white" />;
    }
  };

  const getSensorColor = () => {
    switch (selectedSensor) {
      case 'temperature': return '#FF6B6B';
      case 'humidity': return '#4ECDC4';
      case 'light': return '#FFE66D';
      default: return '#FF6B6B';
    }
  };

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            className="border rounded-lg px-3 py-2 text-sm text-white"
            style={{ backgroundColor: '#1E1E1E', borderColor: '#404040' }}
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
          <div className="text-sm text-gray-400">English</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-8">
        {/* Left Card: Sensor Control - 30% */}
        <div className="lg:col-span-3 rounded-xl p-6 bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-700/30">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30">
                {getSensorIcon()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white capitalize">{selectedSensor}ator</h3>
                <p className="text-xs text-gray-400">Real-time monitoring</p>
              </div>
            </div>
          </div>
          
          {/* Main Value Display */}
          <div className="text-center mb-8">
            <div className="relative">
              <div className="text-6xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                {getCurrentValue().toFixed(0)}
              </div>
              <div className="absolute -top-2 -right-4 text-2xl font-bold text-gray-400">
                {getCurrentUnit()}
              </div>
            </div>
            <div className="text-sm text-gray-400 capitalize font-medium tracking-wide">
              {selectedSensor} Level
            </div>
          </div>
          
          {/* Circular Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-700"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={getSensorColor()}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(getCurrentValue() / (selectedSensor === 'light' ? 1000 : selectedSensor === 'humidity' ? 100 : 50)) * 251.2} 251.2`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                  style={{ filter: `drop-shadow(0 0 8px ${getSensorColor()}40)` }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm font-bold text-white">
                    {Math.round((getCurrentValue() / (selectedSensor === 'light' ? 1000 : selectedSensor === 'humidity' ? 100 : 50)) * 100)}%
                  </div>
                  <div className="text-xs text-gray-400">Status</div>
                </div>
              </div>
            </div>
          </div>

          {/* Gradient Slider */}
          <div className="mb-6">
            <div className="relative h-2 rounded-full bg-gray-700/50 overflow-hidden">
              <div 
                className="absolute h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${(getCurrentValue() / (selectedSensor === 'light' ? 1000 : selectedSensor === 'humidity' ? 100 : 50)) * 100}%`,
                  background: selectedSensor === 'temperature' ? 
                    'linear-gradient(90deg, #4FC3F7 0%, #FF6B6B 50%, #FF5722 100%)' : 
                    selectedSensor === 'humidity' ? 
                    'linear-gradient(90deg, #81C784 0%, #4ECDC4 70%, #26A69A 100%)' :
                    'linear-gradient(90deg, #FFF176 0%, #FFE66D 50%, #FFCC02 100%)',
                  boxShadow: `0 0 12px ${getSensorColor()}40`
                }}
              />
              <div 
                className="absolute w-5 h-5 bg-white rounded-full -top-1.5 border-2 transition-all duration-500 shadow-lg"
                style={{ 
                  left: `${(getCurrentValue() / (selectedSensor === 'light' ? 1000 : selectedSensor === 'humidity' ? 100 : 50)) * 100}%`, 
                  transform: 'translateX(-50%)',
                  borderColor: getSensorColor(),
                  boxShadow: `0 0 8px ${getSensorColor()}60`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
              <span>Min</span>
              <span>{selectedSensor === 'light' ? '1000 lux' : selectedSensor === 'humidity' ? '100%' : '50°C'}</span>
            </div>
          </div>
          
          {/* Sensor Selection Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setSelectedSensor('temperature')}
              className={`p-3 rounded-xl transition-all duration-300 ${
                selectedSensor === 'temperature' 
                  ? 'bg-gradient-to-r from-red-500/30 to-pink-500/30 border border-red-400/50 shadow-lg' 
                  : 'bg-gray-700/30 border border-gray-600/30 hover:bg-gray-600/40'
              }`}
            >
              <Thermometer className={`h-5 w-5 mx-auto ${selectedSensor === 'temperature' ? 'text-red-400' : 'text-gray-400'}`} />
              <div className="text-xs mt-1 font-medium">Temp</div>
            </button>
            <button 
              onClick={() => setSelectedSensor('humidity')}
              className={`p-3 rounded-xl transition-all duration-300 ${
                selectedSensor === 'humidity' 
                  ? 'bg-gradient-to-r from-teal-500/30 to-cyan-500/30 border border-teal-400/50 shadow-lg' 
                  : 'bg-gray-700/30 border border-gray-600/30 hover:bg-gray-600/40'
              }`}
            >
              <Droplets className={`h-5 w-5 mx-auto ${selectedSensor === 'humidity' ? 'text-teal-400' : 'text-gray-400'}`} />
              <div className="text-xs mt-1 font-medium">Humid</div>
            </button>
            <button 
              onClick={() => setSelectedSensor('light')}
              className={`p-3 rounded-xl transition-all duration-300 ${
                selectedSensor === 'light' 
                  ? 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border border-yellow-400/50 shadow-lg' 
                  : 'bg-gray-700/30 border border-gray-600/30 hover:bg-gray-600/40'
              }`}
            >
              <Sun className={`h-5 w-5 mx-auto ${selectedSensor === 'light' ? 'text-yellow-400' : 'text-gray-400'}`} />
              <div className="text-xs mt-1 font-medium">Light</div>
            </button>
          </div>
        </div>

        {/* Right Card: Chart - 70% */}
        <div className="lg:col-span-7 rounded-xl p-6" style={{ backgroundColor: '#1E1E1E' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white capitalize">{selectedSensor} Status</h3>
            
            {/* Time Filter Dropdown */}
            <div className="flex items-center space-x-4">
              <select 
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value as 'today' | 'week' | 'month')}
                className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getSensorColor() }}></div>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(-15)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DEVICES Section */}
      <div className="rounded-xl p-6" style={{ backgroundColor: '#1E1E1E' }}>
        <h3 className="text-lg font-medium text-white mb-6 text-center">DEVICES</h3>
        
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          {(devices.length > 0 ? devices.slice(0, 3) : [
            // FAKE DATA - Easy to remove later
            { ID: 1, name: 'Light 1', status: 'OF', type: 'light' },
            { ID: 2, name: 'Light 2', status: 'OFF', type: 'light' },
            { ID: 3, name: 'Light 3', status: 'ON', type: 'light' }
          ]).map((device, index) => (
            <div key={device.ID} className="text-center">
              <div className="flex flex-col items-center space-y-4">
                <Lightbulb className="h-8 w-8 text-gray-300" />
                <div>
                  <div className="text-white font-medium mb-1">Light {index + 1}</div>
                    <div className="text-xs text-gray-400 mb-3">
                      {device.status === 'ON' ? '0.02W' : '0.00W'}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={device.status === 'ON'}
                        onChange={() => {}}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" style={{ backgroundColor: device.status === 'ON' ? '#10B981' : '#404040' }}></div>
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