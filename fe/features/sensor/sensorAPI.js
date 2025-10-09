import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:8080/api/v1/sensor',
  credentials: 'include', // Để gửi cookies với mỗi request
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const refreshResult = await fetchBaseQuery({
      baseUrl: 'http://localhost:8080/api/v1/user',
      credentials: 'include',
    })(
      {
        url: '/refresh-token',
        method: 'POST',
      },
      api,
      extraOptions
    );
    
    if (refreshResult.data) {
      result = await baseQuery(args, api, extraOptions);
    } else {
      localStorage.removeItem('authState');
      window.location.href = '/login';
    }
  }
  
  return result;
};

export const sensorAPI = createApi({
  reducerPath: 'sensorAPI',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['SensorData'],
  endpoints: (builder) => ({
    getAllSensorData: builder.query({
      query: ({ limit = 20, page = 0 } = {}) => `/all?limit=${limit}&page=${page}`,
      providesTags: ['SensorData'],
      pollingInterval: 60000, // Tự động làm mới mỗi 60 giây
    }),
    getSensorDataById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'SensorData', id }],
    }),
    getLastSensorData: builder.query({
      query: () => '/last',
      providesTags: ['SensorData'],
      // Keep data fresh by refetching every 10 seconds for latest data
      pollingInterval: 10000,
    }),
    // Get sensor data with date range (if your API supports it)
    getSensorDataByDateRange: builder.query({
      query: ({ startDate, endDate, limit = 100 }) => 
        `/range?start_date=${startDate}&end_date=${endDate}&limit=${limit}`,
      providesTags: ['SensorData'],
    }),
  }),
});

export const {
  useGetAllSensorDataQuery,
  useGetSensorDataByIdQuery,
  useGetLastSensorDataQuery,
  useGetSensorDataByDateRangeQuery,
} = sensorAPI;