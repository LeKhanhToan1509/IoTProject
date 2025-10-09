package main

import (
	"context"
	bridge "iot/brigde"
	"iot/internal/helper/mailer"
	"iot/internal/initialize"
	"iot/internal/middlewares"
	"iot/internal/repository"
	"iot/internal/routes"
	"iot/internal/services"
	"iot/pkg/config"
	"iot/pkg/logger"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	logger.InitLogger()
	rootCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	r := gin.New()
	r.Use(middlewares.CorsMiddleware())
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	// Set Gin to release mode
	gin.SetMode(gin.ReleaseMode)

	db, err := initialize.InitMysql(rootCtx)
	if err != nil {
		logger.Log.Fatal("Failed to initialize MySQL", zap.Error(err))
	}

	redisClient, err := initialize.InitRedis(rootCtx)
	if err != nil {
		logger.Log.Fatal("Failed to initialize Redis", zap.Error(err))
	}

	mqttClient, err := initialize.InitMqtt(rootCtx)
	if err != nil {
		logger.Log.Fatal("Failed to initialize MQTT", zap.Error(err))
	}

	mailerService := mailer.NewMailService(config.GetConfig().EmailConfig, logger.Log)

	socketHub := initialize.InitSocketServer(r)
	if socketHub != nil {
		go socketHub.Run()
	}

	if mqttClient != nil && socketHub != nil {
		sensorRepo := services.NewSensorService(repository.NewSensorRepository())
		bridge := bridge.NewMqttSocketBridge(mqttClient, socketHub, redisClient, db, sensorRepo)
		go bridge.SubscribeSensorData(rootCtx)
	}
	routes.InitRouter(r, db, mailerService, redisClient, rootCtx, mqttClient)

	server := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Log.Error("Gin server error", zap.Error(err))
		}
	}()

	<-rootCtx.Done()
	logger.Log.Info("Shutting down gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = server.Shutdown(ctx)
}
