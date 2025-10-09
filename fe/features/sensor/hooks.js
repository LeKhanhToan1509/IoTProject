import { useSelector, useDispatch } from 'react-redux';
import { 
  useGetAllSensorDataQuery,
  useGetSensorDataByIdQuery,
  useGetLastSensorDataQuery,
  useGetSensorDataByDateRangeQuery 
} from './sensorAPI';
import { 
  setCurrentData,
  setHistoricalData,
  updateChartData,
  addRealtimeData,
  setConnectionStatus,
  setLoading,
  setError,
  clearError 
} from './sensorSlice';

export const useSensor = () => {
  const dispatch = useDispatch();
  const sensorState = useSelector((state) => state.sensor);
  
  // RTK Query hooks with auto-polling
  const { 
    data: lastSensorData, 
    isLoading: isLoadingLast, 
    error: lastDataError 
  } = useGetLastSensorDataQuery(undefined, {
    pollingInterval: 10000, // Poll every 10 seconds
  });

  const { 
    data: allSensorData, 
    isLoading: isLoadingAll, 
    error: allDataError 
  } = useGetAllSensorDataQuery({ limit: 20 }, {
    pollingInterval: 30000, // Poll every 30 seconds
  });

  // Update current sensor data
  const updateCurrentData = (sensorData) => {
    dispatch(setCurrentData(sensorData));
  };

  // Update historical data
  const updateHistoricalData = (data) => {
    dispatch(setHistoricalData(data));
    dispatch(updateChartData(data));
  };

  // Add real-time data (for WebSocket updates)
  const addNewSensorData = (data) => {
    dispatch(addRealtimeData(data));
  };

  // Set connection status
  const updateConnectionStatus = (status) => {
    dispatch(setConnectionStatus(status));
  };

  // Handle errors
  const handleError = (error) => {
    dispatch(setError(error));
  };

  const clearSensorError = () => {
    dispatch(clearError());
  };

  // Get sensor data by date range
  const getSensorDataByRange = async (startDate, endDate, limit = 100) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      // This would need to be implemented as a lazy query or mutation
      // For now, we'll use the query hook directly in components
      return { success: true };
    } catch (error) {
      dispatch(setError(error.message || 'Failed to fetch sensor data'));
      return { success: false, error: error.message };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Auto-update current data when API data changes
  React.useEffect(() => {
    if (lastSensorData?.data) {
      updateCurrentData({
        temperature: lastSensorData.data.temperature,
        humidity: lastSensorData.data.humidity,
        light: lastSensorData.data.light,
      });
      dispatch(setConnectionStatus(true));
    }

    if (lastDataError) {
      dispatch(setConnectionStatus(false));
      dispatch(setError('Failed to fetch latest sensor data'));
    }
  }, [lastSensorData, lastDataError, dispatch]);

  // Update chart data when all sensor data changes
  React.useEffect(() => {
    if (allSensorData?.data) {
      dispatch(updateChartData(allSensorData.data));
    }

    if (allDataError) {
      dispatch(setError('Failed to fetch sensor history'));
    }
  }, [allSensorData, allDataError, dispatch]);

  return {
    ...sensorState,
    // Data from RTK Query
    lastSensorData: lastSensorData?.data,
    allSensorData: allSensorData?.data,
    isLoading: isLoadingLast || isLoadingAll || sensorState.loading,
    // Actions
    updateCurrentData,
    updateHistoricalData,
    addNewSensorData,
    updateConnectionStatus,
    handleError,
    clearSensorError,
    getSensorDataByRange,
    // RTK Query hooks for direct use in components
    useGetAllSensorData: useGetAllSensorDataQuery,
    useGetSensorDataById: useGetSensorDataByIdQuery,
    useGetLastSensorData: useGetLastSensorDataQuery,
    useGetSensorDataByDateRange: useGetSensorDataByDateRangeQuery,
  };
};

import React from 'react';