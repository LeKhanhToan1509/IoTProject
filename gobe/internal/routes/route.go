package routes

import (
	"iot/internal/handler"
	"iot/internal/helper/mailer"

	"iot/internal/repository"
	"iot/internal/services"

	"iot/pkg/logger"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func InitRouter(r *gin.Engine, db *gorm.DB, mailer *mailer.MailService, redis *redis.Client) *gin.Engine {
	// Middleware
	r.Use(logger.GinLogger())
	r.Use(logger.GinRecovery(true))

	api := r.Group("/api/v1")
	SetupUserRoute(api, db, mailer, redis)

	return r
}

func SetupUserRoute(api *gin.RouterGroup, db *gorm.DB, mailer *mailer.MailService, redis *redis.Client) {
	userRepo := repository.NewUserRepository()
	// Khởi tạo service
	userService := services.NewUserService(userRepo) // service thực hiện logic
	// Khởi tạo handler
	userHandler := handler.NewUserHandler(db, userService, mailer, redis)

	// Setup route
	(&UserRoute{UserHandler: userHandler}).Setup(api)
}

func SetupDeviceRoute(api *gin.RouterGroup, db *gorm.DB, redis *redis.Client) {
	deviceRepo := repository.NewDeviceRepository()
	// Khởi tạo service
	deviceService := services.NewDeviceService(deviceRepo) // service thực hiện logic
	// Khởi tạo handler
	deviceHandler := handler.NewDeviceHandler(db, redis, deviceService)

	// Setup route
	(&DeviceRoute{DeviceHandler: deviceHandler}).Setup(api)
}
