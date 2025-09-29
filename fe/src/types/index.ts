// Base types
export interface BaseEntity {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt?: string;
}

// User types
export interface User extends BaseEntity {
  name: string;
  email: string;
  data?: User; // For nested response structure
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user?: User;
  access_token?: string;
  refresh_token?: string;
  data?: {
    user: User;
    access_token: string;
    refresh_token: string;
    message: string;
  };
  success?: boolean;
  message?: string;
}

// Device types
export interface Device extends BaseEntity {
  name: string;
  status: 'ON' | 'OFF';
}

export interface CreateDeviceRequest {
  name: string;
  status: 'ON' | 'OFF';
}

export interface UpdateDeviceStatusRequest {
  status: 'ON' | 'OFF';
}

// Sensor Data types
export interface SensorData extends BaseEntity {
  temperature: number;
  humidity: number;
  light: number;
}

export interface CreateSensorDataRequest {
  temperature: number;
  humidity: number;
  light: number;
}

// Device History types
export interface DeviceHistory extends BaseEntity {
  user_id: number;
  device_id: string;
  user_change: string;
  status: 'ON' | 'OFF';
  User?: User;
  Device?: Device;
}

export interface CreateDeviceHistoryRequest {
  user_id: number;
  device_id: string;
  user_change: string;
  status: 'ON' | 'OFF';
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}