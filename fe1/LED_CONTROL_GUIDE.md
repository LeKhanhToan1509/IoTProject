# Hướng dẫn sử dụng tính năng Điều khiển LED

## Tổng quan
Dashboard hiện đã được tích hợp tính năng điều khiển LED thông qua API, hiển thị thông tin người dùng đăng nhập và quản lý trạng thái thiết bị.

## Tính năng đã được thêm

### 1. **Xác thực người dùng**
- Hiển thị thông tin người dùng đăng nhập (tên, ID, email)
- Chỉ cho phép điều khiển thiết bị khi đã đăng nhập
- Panel thông tin user ở góc trên bên phải

### 2. **Điều khiển LED**
- API Endpoint: `http://localhost:8080/api/v1/device/control`
- Payload format:
```json
{
  "device1": {
    "device_id": 1,
    "status": "ON/OFF",
    "user_id": 1,
    "user_change": "Tên người dùng"
  },
  "device2": {
    "device_id": 2,
    "status": "ON/OFF", 
    "user_id": 1,
    "user_change": "Tên người dùng"
  },
  "device3": {
    "device_id": 3,
    "status": "ON/OFF",
    "user_id": 1,
    "user_change": "Tên người dùng"
  }
}
```

### 3. **Giao diện cải tiến**
- Toggle switch với trạng thái loading
- Hiển thị công suất tiêu thụ (0.02W khi ON, 0.00W khi OFF)
- Thông báo khi người dùng chưa đăng nhập
- Loading spinner khi đang điều khiển thiết bị

### 4. **Quản lý trạng thái**
- Tự động refresh danh sách thiết bị sau khi điều khiển
- Giữ nguyên trạng thái của các thiết bị khác khi toggle một thiết bị
- Xử lý lỗi và hiển thị thông báo

## Files đã tạo/cập nhật

### 1. **Services**
- `src/services/deviceControlService.ts` - Service xử lý API điều khiển thiết bị
- `src/utils/testDeviceControl.ts` - Utility test API

### 2. **Hooks**
- `src/hooks/useDevices.ts` - Hook quản lý thiết bị
- `src/hooks/useSensorWebSocket.ts` - Đã cải tiến để xử lý dữ liệu đúng thứ tự

### 3. **Components**
- `src/pages/Dashboard.tsx` - Dashboard chính với tính năng điều khiển LED

## Cách sử dụng

### 1. **Đăng nhập**
```typescript
// Người dùng cần đăng nhập trước để có thông tin user
const { user, isAuthenticated } = useAuth();
```

### 2. **Điều khiển thiết bị**
```typescript
// Tự động lấy thông tin user và gọi API
const handleDeviceToggle = async (deviceId, currentStatus) => {
  // Gọi API với thông tin user đăng nhập
  await deviceControlService.toggleDevice(
    deviceId,
    currentStatus, 
    user.ID,
    user.name,
    deviceStatusMap
  );
};
```

### 3. **Test API**
```typescript
// Import và chạy test
import { testDeviceControl } from './utils/testDeviceControl';
testDeviceControl();
```

## Debug và Monitoring

Dashboard hiển thị các thông tin debug:
- Số lượng dữ liệu sensor tổng cộng và đang hiển thị
- Thời gian của điểm dữ liệu mới nhất
- Khoảng thời gian của dữ liệu trong biểu đồ
- Thông tin user đăng nhập
- Trạng thái WebSocket connection

## Lưu ý quan trọng

1. **Xác thực bắt buộc**: Phải đăng nhập để điều khiển thiết bị
2. **API Format**: Luôn gửi trạng thái của cả 3 thiết bị trong một request
3. **Error Handling**: Có thông báo lỗi chi tiết khi API call failed
4. **Loading States**: UI hiển thị trạng thái loading khi đang xử lý

## Troubleshooting

### Lỗi thường gặp:
1. **"User not authenticated"**: Cần đăng nhập trước
2. **API 500/400**: Kiểm tra format payload và server
3. **Toggle không hoạt động**: Kiểm tra network và server logs

### Debug:
- Mở Developer Console để xem logs chi tiết
- Kiểm tra Network tab để xem API requests
- Xem Dashboard debug panel ở góc trên bên phải