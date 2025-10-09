import axios from 'axios';

// Tạo Axios instance với baseURL và credentials
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1', // Thay đổi nếu cần
  withCredentials: true, // Gửi cookies/auth headers tự động
});

// Interceptor cho request - Không cần thêm gì vì dùng cookies
apiClient.interceptors.request.use(
  (config) => {
    // Cookies sẽ được gửi tự động nhờ withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho response - xử lý 401 bằng refresh token
apiClient.interceptors.response.use(
  (response) => response, // Trả về response bình thường
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Đánh dấu để tránh loop

      try {
        console.log('Token hết hạn, đang refresh...');
        // Gọi refresh token - server sẽ set cookie mới tự động
        const refreshResponse = await apiClient.post('/user/refresh-token');
        
        if (refreshResponse.status === 200) {
          console.log('Refresh token thành công, retry request...');
          // Không cần set gì vì cookie đã được server set rồi
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh token failed');
        }
      } catch (refreshError) {
        // Nếu refresh fail, redirect login
        console.error('Refresh token failed:', refreshError);
        // Clear localStorage nếu có dùng
        localStorage.removeItem('authState');
        window.location.href = '/login'; // Redirect login
        return Promise.reject(refreshError);
      }
    }

    // Lỗi khác, reject bình thường
    return Promise.reject(error);
  }
);

export default apiClient;