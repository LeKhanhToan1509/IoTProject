package routes

import (
	"iot/internal/handler"
	"iot/internal/middlewares"

	"github.com/gin-gonic/gin"
)

type SensorRoute struct {
	SensorHandler handler.SensorHandlerInterface
}

func (r *SensorRoute) Setup(api *gin.RouterGroup) {
	auth := middlewares.Authen()
	sensor := api.Group("/sensor")
	{
		sensor.Use(auth)
		{
			sensor.GET("/all", r.SensorHandler.GetAllSensorData)
			sensor.GET("/:id", r.SensorHandler.GetSensorDataByID)
			sensor.GET("/last", r.SensorHandler.GetLastSensorData)
		}
	}
}
