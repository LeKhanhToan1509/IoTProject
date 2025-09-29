import React, { useState, useEffect } from 'react';
import { History, Filter, Search } from 'lucide-react';
import { deviceHistoryService } from '../services/deviceHistoryService';
import LoadingSpinner from '../components/LoadingSpinner';
import type { DeviceHistory, PaginatedResponse } from '../types';

const DeviceHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<DeviceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  });

  useEffect(() => {
    fetchHistory();
  }, [pagination.page, selectedDevice, searchTerm]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (selectedDevice) {
        const data = await deviceHistoryService.getDeviceHistoryByDeviceId(selectedDevice);
        setHistory(data);
        setPagination(prev => ({ ...prev, total: data.length, total_pages: 1 }));
      } else {
        const response: PaginatedResponse<DeviceHistory> = await deviceHistoryService.getDeviceHistories(
          pagination.page,
          pagination.limit
        );
        setHistory(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.total,
          total_pages: response.total_pages,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch device history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter history based on search term
  const filteredHistory = history.filter(item => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      item.user_change.toLowerCase().includes(searchLower) ||
      item.device_id.toLowerCase().includes(searchLower) ||
      (item.User?.name || `User ${item.user_id}`).toLowerCase().includes(searchLower) ||
      item.status.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full border';
    if (status === 'ON') {
      return `${baseClasses} bg-emerald-500/20 text-emerald-400 border-emerald-500/30`;
    }
    return `${baseClasses} bg-red-500/20 text-red-400 border-red-500/30`;
  };

  const getActionIcon = (userChange: string) => {
    if (userChange.toLowerCase().includes('turn on') || userChange.toLowerCase().includes('activated')) {
      return '⚡';
    } else if (userChange.toLowerCase().includes('turn off') || userChange.toLowerCase().includes('deactivated')) {
      return '�';
    }
    return '⚙️';
  };

  // Get unique device IDs for filter
  const uniqueDeviceIds = [...new Set(history.map(h => h.device_id))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white" style={{ backgroundColor: '#0F0F0F', minHeight: '100vh' }}>
      {/* Header with Search */}
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-600/20 border border-purple-500/30 mr-4">
              <History className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Device History</h1>
              <p className="text-sm text-gray-400">Track device activities</p>
            </div>
          </div>
          <div className="text-sm text-gray-400">English</div>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by user, device, action, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Device Filter */}
          <div className="flex items-center space-x-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl px-4 py-3">
            <Filter className="h-4 w-4 text-purple-400" />
            <select
              value={selectedDevice}
              onChange={(e) => {
                setSelectedDevice(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="bg-transparent text-white text-sm focus:outline-none"
            >
              <option value="" className="bg-gray-800">All Devices</option>
              {uniqueDeviceIds.map(deviceId => (
                <option key={deviceId} value={deviceId} className="bg-gray-800">
                  Device {deviceId}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Simple Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-4 bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-700/30 text-center">
          <p className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {filteredHistory.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total Actions</p>
        </div>

        <div className="rounded-xl p-4 bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-700/30 text-center">
          <p className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            {filteredHistory.filter(h => h.status === 'ON').length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Active Now</p>
        </div>

        <div className="rounded-xl p-4 bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-700/30 text-center">
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
            {new Set(filteredHistory.map(h => h.user_id)).size}
          </p>
          <p className="text-xs text-gray-400 mt-1">Users</p>
        </div>
      </div>

      {/* History Timeline */}
      <div className="rounded-xl bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-700/30">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Activity Timeline</h3>
            <div className="text-sm text-gray-400">
              {selectedDevice 
                ? `Device ${selectedDevice} - ${filteredHistory.length} actions`
                : `${filteredHistory.length} actions ${searchTerm ? '(filtered)' : ''}`
              }
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredHistory.length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {filteredHistory.map((item, index) => (
                  <li key={item.ID}>
                    <div className="relative pb-8">
                      {index !== filteredHistory.length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gradient-to-b from-gray-600 to-gray-700"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-4">
                        <div>
                          <span className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 border-2 border-gray-600 flex items-center justify-center ring-4 ring-gray-900/20 text-lg shadow-lg backdrop-blur-sm">
                            {getActionIcon(item.user_change)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-white">
                              <span className="font-semibold text-blue-400">
                                {item.User?.name || `User ${item.user_id}`}
                              </span>
                              {' '}
                              <span className="text-gray-300">{item.user_change}</span>
                              {' '}
                              <span className="font-medium text-purple-400">Device {item.device_id}</span>
                            </p>
                            <div className="mt-2 flex items-center space-x-3">
                              <span className={getStatusBadge(item.status)}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap">
                            <div className="text-gray-300 font-medium">
                              {new Date(item.CreatedAt).toLocaleDateString()}
                            </div>
                            <div className="text-gray-400 text-xs mt-1">
                              {new Date(item.CreatedAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-gradient-to-r from-gray-700/30 to-gray-800/30 border border-gray-600/30 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <History className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">No history found</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                {selectedDevice 
                  ? `No actions have been recorded for Device ${selectedDevice} yet.`
                  : searchTerm 
                  ? `No results found for "${searchTerm}". Try a different search term.`
                  : 'No device actions have been recorded in the system yet.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!selectedDevice && pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Page <span className="text-white font-medium">{pagination.page}</span> of {pagination.total_pages}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.total_pages}
                  className="px-4 py-2 bg-purple-600 border border-purple-500/50 rounded-lg text-sm text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceHistoryPage;