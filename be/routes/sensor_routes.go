package routes

import (
	"iot/internal/handler"

	"github.com/gin-gonic/gin"
)

// SetupSensorRoutes sets up sensor data routes
func SetupSensorRoutes(api *gin.RouterGroup, sensorHandler *handler.SensorDataHandler) {
	sensorRoutes := api.Group("/sensor-data")
	{
		sensorRoutes.POST("", sensorHandler.CreateSensorData)          // POST /api/sensor-data
		sensorRoutes.GET("", sensorHandler.GetAllSensorData)           // GET /api/sensor-data
		sensorRoutes.GET("/latest", sensorHandler.GetLatestSensorData) // GET /api/sensor-data/latest
		sensorRoutes.GET("/:id", sensorHandler.GetSensorDataByID)      // GET /api/sensor-data/:id
		sensorRoutes.PUT("/:id", sensorHandler.UpdateSensorData)       // PUT /api/sensor-data/:id
		sensorRoutes.DELETE("/:id", sensorHandler.DeleteSensorData)    // DELETE /api/sensor-data/:id
	}
}
