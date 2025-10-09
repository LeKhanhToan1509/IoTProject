import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:8080/api/v1/device',
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
      // Retry the original query
      result = await baseQuery(args, api, extraOptions);
    } else {
      localStorage.removeItem('authState');
      window.location.href = '/login';
    }
  }
  
  return result;
};

export const deviceAPI = createApi({
  reducerPath: 'deviceAPI',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Device', 'DeviceHistory'],
  endpoints: (builder) => ({
    createDevice: builder.mutation({
      query: (deviceData) => ({
        url: '',
        method: 'POST',
        body: deviceData,
      }),
      invalidatesTags: ['Device'],
    }),
    getAllDevices: builder.query({
      query: () => '/all',
      providesTags: ['Device'],
    }),
    getDeviceById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Device', id }],
    }),
    updateDevice: builder.mutation({
      query: ({ id, ...deviceData }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: deviceData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Device', id },
        'Device',
        'DeviceHistory'
      ],
    }),
    deleteDevice: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Device'],
    }),
    controlDevice: builder.mutation({
      query: (controlData) => ({
        url: '/control',
        method: 'POST',
        body: controlData,
      }),
      invalidatesTags: ['Device', 'DeviceHistory'],
    }),
    // Multiple device control (if your API supports it)
    controlMultipleDevices: builder.mutation({
      query: (devicesData) => ({
        url: '/control/multiple',
        method: 'POST',
        body: devicesData,
      }),
      invalidatesTags: ['Device', 'DeviceHistory'],
    }),
  }),
});

export const {
  useCreateDeviceMutation,
  useGetAllDevicesQuery,
  useGetDeviceByIdQuery,
  useUpdateDeviceMutation,
  useDeleteDeviceMutation,
  useControlDeviceMutation,
  useControlMultipleDevicesMutation,
} = deviceAPI;