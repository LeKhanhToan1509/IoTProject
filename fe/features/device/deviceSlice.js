import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  devices: [],
  selectedDevice: null,
  deviceHistory: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setDevices: (state, action) => {
      state.devices = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    setSelectedDevice: (state, action) => {
      state.selectedDevice = action.payload;
    },
    updateDeviceStatus: (state, action) => {
      const { deviceId, status } = action.payload;
      const device = state.devices.find(d => d.id === deviceId);
      if (device) {
        device.status = status;
        device.updated_at = new Date().toISOString();
      }
      state.lastUpdated = new Date().toISOString();
    },
    addDevice: (state, action) => {
      state.devices.push(action.payload);
      state.lastUpdated = new Date().toISOString();
    },
    removeDevice: (state, action) => {
      state.devices = state.devices.filter(d => d.id !== action.payload);
      if (state.selectedDevice?.id === action.payload) {
        state.selectedDevice = null;
      }
      state.lastUpdated = new Date().toISOString();
    },
    setDeviceHistory: (state, action) => {
      state.deviceHistory = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setDevices,
  setSelectedDevice,
  updateDeviceStatus,
  addDevice,
  removeDevice,
  setDeviceHistory,
  setLoading,
  setError,
  clearError,
} = deviceSlice.actions;

export default deviceSlice.reducer;