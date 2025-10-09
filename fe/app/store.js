import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/AuthSlice';
import deviceReducer from '../features/device/deviceSlice';
import sensorReducer from '../features/sensor/sensorSlice';

// RTK Query APIs
import { authAPI } from '../features/auth/authAPI';
import { deviceAPI } from '../features/device/deviceAPI';
import { sensorAPI } from '../features/sensor/sensorAPI';

// Middleware để sync state với localStorage
const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Sync auth state với localStorage khi có thay đổi
  if (action.type?.startsWith('auth/')) {
    const { auth } = store.getState();
    
    // Save auth state (chỉ những thông tin cần thiết)
    if (auth.isAuthenticated && auth.currentUser) {
      localStorage.setItem('authState', JSON.stringify({
        currentUser: auth.currentUser,
        isAuthenticated: auth.isAuthenticated,
        // Cookies sẽ được server tự động handle
      }));
    } else {
      localStorage.removeItem('authState');
    }
  }
  
  return result;
};

// Preloaded state từ localStorage
const getPreloadedState = () => {
  try {
    const authState = localStorage.getItem('authState');
    if (authState) {
      const parsedAuthState = JSON.parse(authState);
      return {
        auth: {
          ...parsedAuthState,
          isFetching: false,
          isInitialized: false,
          error: null,
        }
      };
    }
  } catch (error) {
    console.warn('Error loading auth state from localStorage:', error);
    localStorage.removeItem('authState');
  }
  return undefined;
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    device: deviceReducer,
    sensor: sensorReducer,
    // RTK Query reducers
    [authAPI.reducerPath]: authAPI.reducer,
    [deviceAPI.reducerPath]: deviceAPI.reducer,
    [sensorAPI.reducerPath]: sensorAPI.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
    .concat(localStorageMiddleware)
    .concat(authAPI.middleware)
    .concat(deviceAPI.middleware)
    .concat(sensorAPI.middleware),
  preloadedState: getPreloadedState(),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
