import React, { useState, useEffect } from 'react';
import { Plus, Power, Edit2, Trash2, Loader2 } from 'lucide-react';
import { deviceService } from '../services/deviceService';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Device } from '../types';

const Devices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    status: 'OFF' as 'ON' | 'OFF',
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      console.log('Fetching devices...');
      const response = await deviceService.getAllDevices();
      console.log('Devices fetched:', response);
      // Ensure data is an array, default to empty array if not
      setDevices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      // Set empty array on error so we show empty state
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (device: Device) => {
    setActionLoading(prev => ({ ...prev, [device.ID]: true }));
    try {
      const newStatus = device.status === 'ON' ? 'OFF' : 'ON';
      await deviceService.controlDevice(device.ID, newStatus);
      
      setDevices(prev =>
        prev.map(d =>
          d.ID === device.ID ? { ...d, status: newStatus } : d
        )
      );
    } catch (error) {
      console.error('Failed to toggle device status:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [device.ID]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDevice) {
        // Update existing device
        await deviceService.updateDevice(editingDevice.ID, { name: formData.name, status: formData.status });
        setDevices(prev =>
          prev.map(d =>
            d.ID === editingDevice.ID ? { ...d, name: formData.name, status: formData.status } : d
          )
        );
      } else {
        // Create new device
        const response = await deviceService.createDevice(formData);
        console.log('Device created:', response);
        if (response.data) {
          setDevices(prev => [...prev, response.data!]);
        }
      }
      
      handleCloseModal();
      // Refresh the device list to ensure we have the latest data
      await fetchDevices();
    } catch (error) {
      console.error('Failed to save device:', error);
    }
  };

  const handleDelete = async (device: Device) => {
    if (!confirm('Are you sure you want to delete "' + device.name + '"?')) return;

    setActionLoading(prev => ({ ...prev, [device.ID]: true }));
    try {
      await deviceService.deleteDevice(device.ID);
      setDevices(prev => prev.filter(d => d.ID !== device.ID));
    } catch (error) {
      console.error('Failed to delete device:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [device.ID]: false }));
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingDevice(null);
    setFormData({ name: '', status: 'OFF' });
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      status: device.status,
    });
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Devices</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </button>
      </div>

      {/* Devices Grid or Empty State */}
      {devices && devices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map(device => (
            <div key={device.ID} className="rounded-lg shadow-xl p-6" style={{ backgroundColor: '#1E1E1E', borderColor: '#404040', border: '1px solid' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{device.name}</h3>
                <div
                  className={'px-3 py-1 rounded-full text-sm font-medium ' + 
                    (device.status === 'ON'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800')
                  }
                >
                  {device.status}
                </div>
              </div>

              <div className="text-sm text-gray-400 mb-4">
                <p>Device ID: {device.ID}</p>
                <p>Created: {new Date(device.CreatedAt).toLocaleDateString()}</p>
                <p>Updated: {new Date(device.UpdatedAt).toLocaleDateString()}</p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleToggleStatus(device)}
                  disabled={actionLoading[device.ID]}
                  className={'flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
                    (device.status === 'ON'
                      ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                      : 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500')
                  }
                >
                  {actionLoading[device.ID] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-1" />
                      {device.status === 'ON' ? 'Turn Off' : 'Turn On'}
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleEdit(device)}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => handleDelete(device)}
                  disabled={actionLoading[device.ID]}
                  className="p-2 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md"
                >
                  {actionLoading[device.ID] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Power className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
          <p className="text-gray-400 mb-4">Get started by adding your first device.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 w-96 shadow-2xl rounded-md" style={{ backgroundColor: '#1E1E1E', borderColor: '#404040', border: '1px solid' }}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingDevice ? 'Edit Device' : 'Add New Device'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!!editingDevice}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'ON' | 'OFF' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OFF">OFF</option>
                    <option value="ON">ON</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {editingDevice ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;