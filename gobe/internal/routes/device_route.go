package routes

import (
	"iot/internal/handler"
	"iot/internal/middlewares"

	"github.com/gin-gonic/gin"
)

type DeviceRoute struct {
	DeviceHandler handler.DeviceHandlerInterface
}

func (r *DeviceRoute) Setup(api *gin.RouterGroup) {
	Device := api.Group("/device")
	{
		Device.Use(middlewares.Authen())
		{
			Device.POST("/", r.DeviceHandler.CreateDevice)
			Device.GET("/:id", r.DeviceHandler.GetDeviceByID)
			Device.GET("/all", r.DeviceHandler.GetAllDevices)
			Device.PUT("/:id", r.DeviceHandler.UpdateDevice)
			Device.DELETE("/:id", r.DeviceHandler.DeleteDevice)
			Device.POST("/control", r.DeviceHandler.DeviceController)
		}
	}
}
