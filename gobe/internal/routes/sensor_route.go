package routes

import (
	"iot/internal/handler"

	"github.com/gin-gonic/gin"
)

type SensorRoute struct {
	SensorHandler handler.SensorHandlerInterface
}

func (r *SensorRoute) Setup(api *gin.RouterGroup) {
	sensor := api.Group("/sensor")
	{
		sensor.GET("/all", r.SensorHandler.GetAllSensorData)
		sensor.GET("/:id", r.SensorHandler.GetSensorDataByID)
		sensor.GET("/last", r.SensorHandler.GetLastSensorData)
	}
}
