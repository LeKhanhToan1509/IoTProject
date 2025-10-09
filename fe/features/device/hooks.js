import { useSelector, useDispatch } from 'react-redux';
import { 
  useGetAllDevicesQuery,
  useGetDeviceByIdQuery,
  useCreateDeviceMutation,
  useUpdateDeviceMutation,
  useDeleteDeviceMutation,
  useControlDeviceMutation,
  useControlMultipleDevicesMutation 
} from './deviceAPI';
import { 
  setDevices,
  setSelectedDevice,
  updateDeviceStatus,
  addDevice,
  removeDevice,
  setLoading,
  setError,
  clearError 
} from './deviceSlice';

export const useDevice = () => {
  const dispatch = useDispatch();
  const deviceState = useSelector((state) => state.device);
  
  const [createDeviceMutation] = useCreateDeviceMutation();
  const [updateDeviceMutation] = useUpdateDeviceMutation();
  const [deleteDeviceMutation] = useDeleteDeviceMutation();
  const [controlDeviceMutation] = useControlDeviceMutation();
  const [controlMultipleDevicesMutation] = useControlMultipleDevicesMutation();

  const createDevice = async (deviceData) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await createDeviceMutation(deviceData).unwrap();
      
      if (result.data) {
        dispatch(addDevice(result.data));
        return { success: true, data: result.data };
      }
    } catch (error) {
      dispatch(setError(error.data?.message || 'Failed to create device'));
      return { success: false, error: error.data?.message || 'Failed to create device' };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const updateDevice = async (deviceId, deviceData) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await updateDeviceMutation({ id: deviceId, ...deviceData }).unwrap();
      
      if (result.data) {
        return { success: true, data: result.data };
      }
    } catch (error) {
      dispatch(setError(error.data?.message || 'Failed to update device'));
      return { success: false, error: error.data?.message || 'Failed to update device' };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const deleteDevice = async (deviceId) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      await deleteDeviceMutation(deviceId).unwrap();
      dispatch(removeDevice(deviceId));
      return { success: true };
    } catch (error) {
      dispatch(setError(error.data?.message || 'Failed to delete device'));
      return { success: false, error: error.data?.message || 'Failed to delete device' };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const controlDevice = async (controlData) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await controlDeviceMutation(controlData).unwrap();
      
      if (result.data) {
        dispatch(updateDeviceStatus({
          deviceId: controlData.device_id,
          status: controlData.status
        }));
        return { success: true, data: result.data };
      }
    } catch (error) {
      dispatch(setError(error.data?.message || 'Failed to control device'));
      return { success: false, error: error.data?.message || 'Failed to control device' };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const controlMultipleDevices = async (devicesData) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await controlMultipleDevicesMutation(devicesData).unwrap();
      
      if (result.data) {
        // Update multiple device statuses
        Object.values(devicesData).forEach(device => {
          dispatch(updateDeviceStatus({
            deviceId: device.device_id,
            status: device.status
          }));
        });
        return { success: true, data: result.data };
      }
    } catch (error) {
      dispatch(setError(error.data?.message || 'Failed to control devices'));
      return { success: false, error: error.data?.message || 'Failed to control devices' };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const selectDevice = (device) => {
    dispatch(setSelectedDevice(device));
  };

  return {
    ...deviceState,
    createDevice,
    updateDevice,
    deleteDevice,
    controlDevice,
    controlMultipleDevices,
    selectDevice,
    // RTK Query hooks for direct use
    useGetAllDevices: useGetAllDevicesQuery,
    useGetDeviceById: useGetDeviceByIdQuery,
  };
};