package routes

import (
	"iot/internal/handler"

	"github.com/gin-gonic/gin"
)

// SetupDeviceRoutes sets up device routes
func SetupDeviceRoutes(api *gin.RouterGroup, deviceHandler *handler.DeviceHandler) {
	deviceRoutes := api.Group("/devices")
	{
		deviceRoutes.POST("", deviceHandler.CreateDevice)                              // POST /api/devices
		deviceRoutes.GET("", deviceHandler.GetAllDevices)                              // GET /api/devices
		deviceRoutes.GET("/:id", deviceHandler.GetDeviceByID)                          // GET /api/devices/:id
		deviceRoutes.GET("/device/:deviceId", deviceHandler.GetDeviceByDeviceID)       // GET /api/devices/device/:deviceId
		deviceRoutes.PUT("/device/:deviceId/status", deviceHandler.UpdateDeviceStatus) // PUT /api/devices/device/:deviceId/status
		deviceRoutes.DELETE("/:id", deviceHandler.DeleteDevice)                        // DELETE /api/devices/:id
	}
}
