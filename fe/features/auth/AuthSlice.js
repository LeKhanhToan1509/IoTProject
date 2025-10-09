import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUser: null,
  isAuthenticated: false,
  isFetching: false,
  isInitialized: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
      state.isAuthenticated = !!action.payload;
      state.error = null;
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('authState');
    },
    setLoading: (state, action) => {
      state.isFetching = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isFetching = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state, action) => {
      state.isInitialized = action.payload;
    },
    loginSuccess: (state, action) => {
      const userData = action.payload.user || action.payload.data || action.payload;
      state.currentUser = userData;
      state.isAuthenticated = true;
      state.isFetching = false;
      state.error = null;
      
      // Save to localStorage for persistence
      const authState = {
        currentUser: userData,
        isAuthenticated: true
      };
      localStorage.setItem('authState', JSON.stringify(authState));
      
      console.log('✅ Auth state updated:', userData);
    },
    logoutSuccess: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.isFetching = false;
      state.error = null;
      localStorage.removeItem('authState');
    },
  },
});

export const { 
  setUser, 
  clearUser, 
  setLoading, 
  setError, 
  clearError, 
  setInitialized,
  loginSuccess,
  logoutSuccess 
} = authSlice.actions;

export default authSlice.reducer;
