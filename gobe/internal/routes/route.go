package routes

import (
	"context"
	"iot/internal/handler"
	"iot/internal/helper/mailer"

	"iot/internal/repository"
	"iot/internal/services"

	"iot/pkg/logger"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func InitRouter(r *gin.Engine, db *gorm.DB, mailer *mailer.MailService, redis *redis.Client, ctx context.Context, mqtt mqtt.Client) *gin.Engine {
	// Middleware
	r.Use(logger.GinLogger())
	r.Use(logger.GinRecovery(true))

	api := r.Group("/api/v1")
	SetupUserRoute(api, db, mailer, redis, ctx)
	SetupDeviceRoute(api, db, redis, ctx, mqtt)
	SetupSensorRoute(api, db, redis)

	return r
}

func SetupUserRoute(api *gin.RouterGroup, db *gorm.DB, mailer *mailer.MailService, redis *redis.Client, ctx context.Context) {
	userRepo := repository.NewUserRepository()
	// Khởi tạo service
	userService := services.NewUserService(userRepo) // service thực hiện logic
	// Khởi tạo handler
	userHandler := handler.NewUserHandler(db, userService, mailer, redis, ctx)

	// Setup route
	(&UserRoute{UserHandler: userHandler}).Setup(api)
}

func SetupDeviceRoute(api *gin.RouterGroup, db *gorm.DB, redis *redis.Client, ctx context.Context, mqtt mqtt.Client) {
	deviceRepo := repository.NewDeviceRepository()
	historyRepo := repository.NewDeviceHistoryRepository()
	// Khởi tạo service
	deviceService := services.NewDeviceService(deviceRepo, historyRepo) // service thực hiện logic
	// Khởi tạo handler
	deviceHandler := handler.NewDeviceHandler(db, redis, deviceService, ctx, mqtt)

	// Setup route
	(&DeviceRoute{DeviceHandler: deviceHandler}).Setup(api)
}

func SetupSensorRoute(api *gin.RouterGroup, db *gorm.DB, redis *redis.Client) {
	sensorRepo := repository.NewSensorRepository()
	// Khởi tạo service
	sensorService := services.NewSensorService(sensorRepo) // service thực hiện logic
	// Khởi tạo handler
	sensorHandler := handler.NewSensorHandler(sensorService, redis, db)

	// Setup route
	(&SensorRoute{SensorHandler: sensorHandler}).Setup(api)
}
