import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Download, RefreshCw, Calendar, TrendingUp } from 'lucide-react';
import { sensorService } from '../services/sensorService';
import LoadingSpinner from '../components/LoadingSpinner';
import type { SensorData, PaginatedResponse } from '../types';

const SensorDataPage: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0,
  });

  useEffect(() => {
    fetchSensorData();
    fetchLatestData();
  }, [pagination.page]);

  const fetchSensorData = async () => {
    try {
      const response: PaginatedResponse<SensorData> = await sensorService.getSensorData(
        pagination.page,
        pagination.limit
      );
      // Ensure data is an array, default to empty array if not
      setSensorData(Array.isArray(response.data) ? response.data : []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        total_pages: response.total_pages || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch sensor data:', error);
      // Set empty array on error
      setSensorData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestData = async () => {
    try {
      const latest = await sensorService.getLatestSensorData();
      setLatestData(latest);
    } catch (error) {
      console.error('Failed to fetch latest sensor data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSensorData(), fetchLatestData()]);
    setRefreshing(false);
  };

  const downloadData = () => {
    const csvContent = [
      'Time,Temperature (°C),Humidity (%),Light (lux)',
      ...sensorData.map(data =>
        `${new Date(data.CreatedAt).toISOString()},${data.temperature},${data.humidity},${data.light}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensor-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Prepare chart data
  const chartData = sensorData.map(data => ({
    time: new Date(data.CreatedAt).toLocaleTimeString(),
    fullTime: new Date(data.CreatedAt).toISOString(),
    temperature: data.temperature,
    humidity: data.humidity,
    light: data.light,
  })).reverse();

  // Calculate stats safely
  const avgTemp = sensorData.length > 0 
    ? sensorData.reduce((sum, data) => sum + data.temperature, 0) / sensorData.length 
    : 0;
  const avgHumidity = sensorData.length > 0
    ? sensorData.reduce((sum, data) => sum + data.humidity, 0) / sensorData.length
    : 0;
  const avgLight = sensorData.length > 0
    ? sensorData.reduce((sum, data) => sum + data.light, 0) / sensorData.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sensor Data</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={downloadData}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Current Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Temperature</p>
              <p className="text-3xl font-bold text-blue-600">
                {latestData?.temperature.toFixed(1) || '--'}°C
              </p>
              <p className="text-sm text-gray-400">
                Avg: {avgTemp.toFixed(1)}°C
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Humidity</p>
              <p className="text-3xl font-bold text-green-600">
                {latestData?.humidity.toFixed(1) || '--'}%
              </p>
              <p className="text-sm text-gray-400">
                Avg: {avgHumidity.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Light</p>
              <p className="text-3xl font-bold text-yellow-600">
                {latestData?.light || '--'} lux
              </p>
              <p className="text-sm text-gray-400">
                Avg: {avgLight.toFixed(0)} lux
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {sensorData && sensorData.length > 0 ? (
        <div className="space-y-6">
        {/* Temperature Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperature Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                labelFormatter={(value, payload) => {
                  if (payload && payload[0]) {
                    return new Date(payload[0].payload.fullTime).toLocaleString();
                  }
                  return value;
                }}
              />
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
                strokeWidth={2}
                name="Temperature (°C)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Humidity Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Humidity Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                labelFormatter={(value, payload) => {
                  if (payload && payload[0]) {
                    return new Date(payload[0].payload.fullTime).toLocaleString();
                  }
                  return value;
                }}
              />
              <Area
                type="monotone"
                dataKey="humidity"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
                strokeWidth={2}
                name="Humidity (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Light Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Light Level Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                labelFormatter={(value, payload) => {
                  if (payload && payload[0]) {
                    return new Date(payload[0].payload.fullTime).toLocaleString();
                  }
                  return value;
                }}
              />
              <Line
                type="monotone"
                dataKey="light"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Light (lux)"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <TrendingUp className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sensor data found</h3>
          <p className="text-gray-500 mb-4">Waiting for sensor data to be collected.</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
        </div>
      )}

      {/* Data Table */}
      {sensorData && sensorData.length > 0 && (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Historical Data</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Showing {sensorData.length} of {pagination.total} records</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temperature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Humidity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Light
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sensorData.map(reading => (
                <tr key={reading.ID}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(reading.CreatedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">{reading.temperature.toFixed(1)}°C</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">{reading.humidity.toFixed(1)}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">{reading.light} lux</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.total_pages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.total_pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
    </div>
  );
};

export default SensorDataPage;