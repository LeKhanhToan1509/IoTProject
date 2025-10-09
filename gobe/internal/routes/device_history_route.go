package routes

import (
	"iot/internal/handler"
	"iot/internal/middlewares"

	"github.com/gin-gonic/gin"
)

type DeviceHistoryRoute struct {
	DeviceHistoryHandler handler.DeviceHistoryHandlerInterface
}

func (r *DeviceHistoryRoute) Setup(api *gin.RouterGroup) {
	DeviceHistory := api.Group("/device_history")
	{
		DeviceHistory.Use(middlewares.Authen())
		{
			DeviceHistory.POST("/", r.DeviceHistoryHandler.CreateDeviceHistory)
			DeviceHistory.GET("", r.DeviceHistoryHandler.GetAllDeviceHistories)
			DeviceHistory.GET("/:deviceID", r.DeviceHistoryHandler.GetDeviceHistoryByDeviceID)
		}
	}
}
