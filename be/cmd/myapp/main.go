package main

import (
	"iot/internal/handler"
	"iot/internal/initialize"
	"iot/internal/repository"
	"iot/logger"
	"iot/routes"
	"iot/services"
	"os"
	"os/signal"
	"syscall"

	"go.uber.org/zap"
)

func main() {
	// Initialize logger first
	logger.InitLogger()
	logger.LogAppStart(":8080")

	// Initialize database
	db := initialize.InitMysql()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	deviceRepo := repository.NewDeviceRepository(db)
	sensorRepo := repository.NewSensorDataRepository(db)
	deviceHistoryRepo := repository.NewDeviceHistoryRepository(db)

	// Initialize services
	serviceContainer := services.NewServiceContainer(userRepo, deviceRepo, sensorRepo, deviceHistoryRepo)

	// Initialize handlers
	userHandler := handler.NewUserHandler(serviceContainer.UserService)
	deviceHandler := handler.NewDeviceHandler(serviceContainer.DeviceService)
	sensorHandler := handler.NewSensorDataHandler(serviceContainer.SensorService)
	deviceHistoryHandler := handler.NewDeviceHistoryHandler(serviceContainer.DeviceHistoryService)

	// Setup routes with handlers
	r := routes.SetupRoutes(sensorHandler, userHandler, deviceHandler, deviceHistoryHandler)

	// Graceful shutdown
	go func() {
		if err := r.Run(":8080"); err != nil {
			logger.Error("Failed to start server", zap.Error(err))
			os.Exit(1)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.LogAppShutdown()
	logger.Close()
}
