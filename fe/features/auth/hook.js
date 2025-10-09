import { useSelector, useDispatch } from 'react-redux';
import { 
  useLoginMutation, 
  useLogoutMutation, 
  useRegisterOTPMutation,
  useRegisterMutation,
  useGetUserByIdQuery,
  useGetAllUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation 
} from './authAPI';
import { 
  loginSuccess, 
  logoutSuccess, 
  setError, 
  setLoading, 
  clearError 
} from './AuthSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  
  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();
  const [registerOTPMutation] = useRegisterOTPMutation();
  const [registerMutation] = useRegisterMutation();
  
  const login = async (credentials) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await loginMutation(credentials).unwrap();
      
      if (result && (result.data || result.user || result.id)) {
        const userData = result.data || result.user || result;
        dispatch(loginSuccess(userData));
        return { success: true, data: userData };
      } else {
        return { success: false, error: 'No user data received' };
      }
    } catch (error) {
      dispatch(setError(error.data?.message || 'Login failed'));
      return { success: false, error: error.data?.message || 'Login failed' };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
      dispatch(logoutSuccess());
      return { success: true };
    } catch (error) {
      dispatch(logoutSuccess());
      return { success: true };
    }
  };

  const registerOTP = async (userData) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await registerOTPMutation(userData).unwrap();
      return { success: true, data: result.data };
    } catch (error) {
      dispatch(setError(error.data?.message || 'Failed to send OTP'));
      return { success: false, error: error.data?.message || 'Failed to send OTP' };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const register = async (registerData) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await registerMutation(registerData).unwrap();
      
      if (result.data) {
        dispatch(loginSuccess(result.data));
        return { success: true, data: result.data };
      }
    } catch (error) {
      dispatch(setError(error.data?.message || 'Registration failed'));
      return { success: false, error: error.data?.message || 'Registration failed' };
    } finally {
      dispatch(setLoading(false));
    }
  };

  return {
    ...authState,
    login,
    logout,
    registerOTP,
    register,
  };
};

export const useUserManagement = () => {
  return {
    useGetUserById: useGetUserByIdQuery,
    useGetAllUsers: useGetAllUsersQuery,
    useUpdateUser: useUpdateUserMutation,
    useDeleteUser: useDeleteUserMutation,
  };
};
