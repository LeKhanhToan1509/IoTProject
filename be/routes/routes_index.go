/*
Package routes contains all HTTP route definitions for the IoT API.

The routes are organized into separate files for better maintainability:

- routes.go: Main router setup and configuration
- sensor_routes.go: Sensor data related endpoints
- user_routes.go: User management endpoints
- device_routes.go: Device management endpoints
- device_history_routes.go: Device history tracking endpoints
- middleware.go: Common middleware functions

Route Structure:
/api
├── /sensor-data
│   ├── POST "" - Create sensor data
│   ├── GET "" - Get all sensor data (paginated)
│   ├── GET "/latest" - Get latest sensor data
│   ├── GET "/:id" - Get sensor data by ID
│   ├── PUT "/:id" - Update sensor data
│   └── DELETE "/:id" - Delete sensor data
├── /users
│   ├── POST "" - Create user
│   ├── GET "" - Get all users (paginated)
│   ├── GET "/:id" - Get user by ID
│   ├── PUT "/:id" - Update user
│   └── DELETE "/:id" - Delete user
├── /devices
│   ├── POST "" - Create device
│   ├── GET "" - Get all devices
│   ├── GET "/:id" - Get device by ID
│   ├── GET "/device/:deviceId" - Get device by device ID
│   ├── PUT "/device/:deviceId/status" - Update device status
│   └── DELETE "/:id" - Delete device
└── /device-histories
	├── POST "" - Create device history
	├── GET "" - Get all device histories (paginated)
	├── GET "/:id" - Get device history by ID
	├── GET "/device/:deviceId" - Get device history by device ID
	├── PUT "/:id" - Update device history
	└── DELETE "/:id" - Delete device history

Additional endpoints:
- GET /health - Health check endpoint

All endpoints support CORS and include proper error handling.
*/
package routes
