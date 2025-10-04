# Refactoring Summary - fe1 Project

## Overview
This document summarizes the refactoring performed on the `fe1` folder to simplify the code and align it with the actual Go backend API structure.

## Changes Made

### 1. API Client (`src/services/apiClient.ts`)
**Before:**
- Complex dual-token authentication system with refresh tokens
- Used `access_token` and `refresh_token` keys in localStorage
- Complex interceptor logic for token refresh

**After:**
- Simple single-token authentication
- Uses `token` key in localStorage
- Simplified interceptor - just adds Authorization header
- Removed unnecessary token refresh logic

### 2. Type Definitions (`src/types/index.ts`)
**Changes:**
- Added `RegisterOTPRequest` type for OTP email registration flow
- Updated `LoginResponse` to match actual API response structure:
  ```typescript
  {
    data: {
      token: string;
      user: User;
    };
    message: string;
  }
  ```
- All API responses follow standard format: `{ data: T, message: string }`

### 3. Authentication Service (`src/services/authService.ts`)
**Before:**
- Multiple unused methods (validateToken, refreshToken, requestPasswordReset, resetPassword, changePassword, verifyEmail, resendVerification)
- Complex authentication flow

**After:**
- Simplified to 4 essential methods:
  - `registerOTP(data)` - Request OTP for registration (POST /user/register/otp)
  - `register(data)` - Register with OTP code (POST /user/register)
  - `login(credentials)` - Login (POST /user/login)
  - `logout()` - Client-side logout (removes token and user from localStorage)

### 4. Sensor Service (`src/services/sensorService.ts`)
**Before:**
- Pagination-based endpoints
- CRUD operations for sensor data
- Multiple unused methods

**After:**
- Simplified to 3 read-only methods matching actual API:
  - `getAllSensorData()` - Get all sensor data (GET /sensor/all)
  - `getSensorDataById(id)` - Get specific sensor data (GET /sensor/:id)
  - `getLatestSensorData()` - Get latest sensor reading (GET /sensor/last)
- Removed create/update/delete methods (not supported by API)

### 5. Device Service (`src/services/deviceService.ts`)
**Before:**
- Mixed ID types (numeric ID and device ID string)
- Complex status update logic
- Endpoint mismatches

**After:**
- Consistent numeric ID usage
- Simplified methods matching actual API:
  - `getAllDevices()` - Get all devices (GET /device/all)
  - `getDeviceById(id)` - Get specific device (GET /device/:id)
  - `createDevice(device)` - Create new device (POST /device/)
  - `updateDevice(id, device)` - Update device (PUT /device/:id)
  - `deleteDevice(id)` - Delete device (DELETE /device/:id)
  - `controlDevice(id, status)` - Control device status (POST /device/control)

### 6. User Service (`src/services/userService.ts`)
**Before:**
- Pagination support
- User creation method

**After:**
- Simplified CRUD operations:
  - `getAllUsers()` - Get all users (GET /user/all)
  - `getUserById(id)` - Get specific user (GET /user/:id)
  - `updateUser(id, user)` - Update user (PUT /user/:id)
  - `deleteUser(id)` - Delete user (DELETE /user/:id)
- Removed `createUser()` (users are created via registration only)

### 7. Page Components

#### Dashboard (`src/pages/Dashboard.tsx`)
- Updated to use new service method names
- Fixed response unwrapping: `response.data` instead of direct response

#### AuthForm (`src/pages/AuthForm.tsx`)
- Updated registration flow to use OTP system:
  1. Request OTP with email
  2. Submit registration with OTP code
- Changed "Resend Verification" to use `registerOTP()` instead of removed method
- Updated error messages to reflect OTP flow

#### Devices (`src/pages/Devices.tsx`)
- Updated to use `getAllDevices()` instead of `getDevices()`
- Changed toggle status to use `controlDevice()` instead of `updateDeviceStatus()`
- Updated edit functionality to use `updateDevice()` with both name and status

#### SensorData (`src/pages/SensorData.tsx`)
- Updated to use `getAllSensorData()` instead of paginated endpoint
- Removed pagination from API calls (still showing data in paginated view)
- Fixed latest data retrieval with proper response unwrapping

#### Users (`src/pages/Users.tsx`)
- Updated to use `getAllUsers()` instead of paginated endpoint
- Removed user creation capability (only available through registration)
- Removed pagination from API calls

## API Endpoints Summary

### Backend API Base URL
```
http://localhost:8080/api/v1
```

### Authentication Endpoints
- `POST /user/register/otp` - Request OTP for registration
- `POST /user/register` - Register with OTP code
- `POST /user/login` - Login

### User Management
- `GET /user/all` - Get all users
- `GET /user/:id` - Get user by ID
- `PUT /user/:id` - Update user
- `DELETE /user/:id` - Delete user

### Device Management
- `GET /device/all` - Get all devices
- `GET /device/:id` - Get device by ID
- `POST /device/` - Create device
- `PUT /device/:id` - Update device
- `DELETE /device/:id` - Delete device
- `POST /device/control` - Control device status

### Sensor Data
- `GET /sensor/all` - Get all sensor data
- `GET /sensor/:id` - Get sensor data by ID
- `GET /sensor/last` - Get latest sensor reading

## Response Format
All API responses follow this standard format:
```typescript
{
  data: T,        // Response data (can be object, array, or null)
  message: string // Success/error message
}
```

### Login Response Structure
```typescript
{
  data: {
    user: {
      id: number;
      name: string;
      email: string;
    };
    token_pair: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      token_type: string;
    };
  };
  message: string;
}
```

## Authentication Flow
1. User enters email → Request OTP
2. User receives OTP via email
3. User completes registration form with OTP → Account created
4. User logs in → Receives JWT token pair (access_token + refresh_token)
5. Tokens stored in localStorage:
   - `access_token` - Used for API authentication
   - `refresh_token` - For refreshing expired access tokens
   - `user` - User profile data (JSON string)
6. Access token included in Authorization header for all subsequent requests

## Testing Checklist
- [ ] Login functionality
- [ ] Registration with OTP flow
- [ ] Dashboard displays sensor data and devices
- [ ] Device control (ON/OFF toggle)
- [ ] Sensor data visualization
- [ ] User management (view, edit, delete)
- [ ] Device management (create, edit, delete)

## Next Steps
1. Test all endpoints with the backend API
2. Verify authentication flow works correctly
3. Test device control functionality
4. Ensure all data displays correctly in the UI
5. Add proper error handling and user feedback
6. Consider adding loading states for better UX

## Notes
- Removed all unused code and methods
- Aligned all API calls with actual backend endpoints
- Simplified authentication to single-token system
- All TypeScript errors resolved
- Code is cleaner and more maintainable
