package routes

import (
	"iot/internal/handler"

	"github.com/gin-gonic/gin"
)

// SetupDeviceHistoryRoutes sets up device history routes
func SetupDeviceHistoryRoutes(api *gin.RouterGroup, deviceHistoryHandler *handler.DeviceHistoryHandler) {
	historyRoutes := api.Group("/device-histories")
	{
		historyRoutes.POST("", deviceHistoryHandler.CreateDeviceHistory)                        // POST /api/device-histories
		historyRoutes.GET("", deviceHistoryHandler.GetAllDeviceHistories)                       // GET /api/device-histories
		historyRoutes.GET("/:id", deviceHistoryHandler.GetDeviceHistoryByID)                    // GET /api/device-histories/:id
		historyRoutes.GET("/device/:deviceId", deviceHistoryHandler.GetDeviceHistoryByDeviceID) // GET /api/device-histories/device/:deviceId
		historyRoutes.PUT("/:id", deviceHistoryHandler.UpdateDeviceHistory)                     // PUT /api/device-histories/:id
		historyRoutes.DELETE("/:id", deviceHistoryHandler.DeleteDeviceHistory)                  // DELETE /api/device-histories/:id
	}
}
