package routes

import (
	"iot/internal/handler"
	"iot/logger"

	"github.com/gin-gonic/gin"
)

// SetupRoutes sets up all routes with handlers
func SetupRoutes(
	sensorHandler *handler.SensorDataHandler,
	userHandler *handler.UserHandler,
	deviceHandler *handler.DeviceHandler,
	deviceHistoryHandler *handler.DeviceHistoryHandler,
) *gin.Engine {
	r := gin.New()

	// Add logger middleware
	r.Use(logger.GinLogger())
	r.Use(logger.GinRecovery())

	// Add CORS middleware
	r.Use(CORSMiddleware())

	// API group
	api := r.Group("/api")

	// Setup all routes using separate route files
	SetupSensorRoutes(api, sensorHandler)
	SetupUserRoutes(api, userHandler)
	SetupDeviceRoutes(api, deviceHandler)
	SetupDeviceHistoryRoutes(api, deviceHistoryHandler)

	// Health check endpoint
	r.GET("/health", HealthCheckRoute)

	return r
}
