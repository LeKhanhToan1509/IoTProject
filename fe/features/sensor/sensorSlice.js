import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentData: {
    temperature: { value: 0, unit: '°C', min: 0, max: 70 },
    humidity: { value: 0, unit: '%', min: 0, max: 100 },
    light: { value: 0, unit: '%', min: 0, max: 100 },
  },
  historicalData: [],
  chartData: {
    temperature: [],
    humidity: [],
    light: []
  },
  isConnected: false,
  lastUpdated: null,
  loading: false,
  error: null,
};

const sensorSlice = createSlice({
  name: 'sensor',
  initialState,
  reducers: {
    setCurrentData: (state, action) => {
      const { temperature, humidity, light } = action.payload;
      state.currentData = {
        temperature: { value: temperature, unit: '°C', min: 0, max: 70 },
        humidity: { value: humidity, unit: '%', min: 0, max: 100 },
        light: { value: light, unit: '%', min: 0, max: 100 },
      };
      state.lastUpdated = new Date().toISOString();
      state.isConnected = true;
    },
    setHistoricalData: (state, action) => {
      state.historicalData = action.payload;
    },
    updateChartData: (state, action) => {
      const newData = action.payload;
      const transformedData = {
        temperature: [],
        humidity: [],
        light: []
      };

      if (Array.isArray(newData) && newData.length > 0) {
        // Sort DESC để mới nhất cuối (API đã sort, nhưng an toàn)
        newData.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

        const firstTimestamp = new Date(newData[newData.length - 1].CreatedAt); // Cũ nhất
        newData.forEach((item, index) => {
          const timestamp = new Date(item.CreatedAt);
          const diffMinutes = Math.round((timestamp - firstTimestamp) / (1000 * 60));
          const timeString = `${diffMinutes}m`;

          transformedData.temperature.push({
            time: timeString,
            value: parseFloat(item.Temperature) || 0,
            timestamp: item.CreatedAt
          });
          
          transformedData.humidity.push({
            time: timeString,
            value: parseFloat(item.Humidity) || 0,
            timestamp: item.CreatedAt
          });
          
          transformedData.light.push({
            time: timeString,
            value: Math.round((parseFloat(item.Light) || 0) / 20), // Scale raw sang % (giả sử max 2000 lux =100%)
            timestamp: item.CreatedAt
          });
        });
      } else {
        console.warn('No data from API, using default 20 dummy points for test');
        // Dummy data nếu API fail
        for (let i = 0; i < 20; i++) {
          const timeString = `${i * 2}m`;
          transformedData.temperature.push({ time: timeString, value: 25 + Math.random() * 10, timestamp: new Date().toISOString() });
          transformedData.humidity.push({ time: timeString, value: 50 + Math.random() * 20, timestamp: new Date().toISOString() });
          transformedData.light.push({ time: timeString, value: Math.random() * 100, timestamp: new Date().toISOString() });
        }
      }

      state.chartData = transformedData;
    },
    addRealtimeData: (state, action) => {
      const { temperature, humidity, light_percent, light_raw, timestamp } = action.payload;
      const timeObj = new Date(timestamp);
      
      // Relative time +2 phút từ last
      const lastTempData = state.chartData.temperature[state.chartData.temperature.length - 1];
      let diffMinutes = 2;
      if (lastTempData) {
        const lastTimeObj = new Date(lastTempData.timestamp);
        diffMinutes = Math.round((timeObj - lastTimeObj) / (1000 * 60)) || 2;
      }
      const lastMin = parseInt((lastTempData?.time || '0m').replace('m', '')) || 0;
      const newTime = `${lastMin + diffMinutes}m`;

      const newDataPoint = {
        time: newTime,
        timestamp: timestamp
      };

      // Push mới, shift nếu >20
      ['temperature', 'humidity', 'light'].forEach(type => {
        let value = action.payload[type];
        if (type === 'light') {
          value = light_percent || (light_raw ? Math.round(light_raw / 20) : value);
        }
        const newPoint = { ...newDataPoint, value: parseFloat(value) || 0 };
        state.chartData[type].push(newPoint);
        
        if (state.chartData[type].length > 20) {
          state.chartData[type].shift(); // Bỏ đầu
        }
      });

      // Update current data
      state.currentData = {
        temperature: { value: temperature, unit: '°C', min: 0, max: 70 },
        humidity: { value: humidity, unit: '%', min: 0, max: 100 },
        light: { value: light_percent || (light_raw ? Math.round(light_raw / 20) : light_raw), unit: '%', min: 0, max: 100 },
      };
      
      state.lastUpdated = timestamp;
      state.isConnected = true;
    },
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isConnected = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setCurrentData,
  setHistoricalData,
  updateChartData,
  addRealtimeData,
  setConnectionStatus,
  setLoading,
  setError,
  clearError,
} = sensorSlice.actions;

export default sensorSlice.reducer;