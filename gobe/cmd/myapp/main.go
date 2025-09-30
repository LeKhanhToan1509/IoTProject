package main

import (
	"context"
	"iot/brigde"
	"iot/internal/helper/mailer"
	"iot/internal/initialize"
	"iot/internal/routes"
	"iot/pkg/config"
	"iot/pkg/logger"
	mymqtt "iot/pkg/mqtt"
	"os"
	"os/signal"
	"syscall"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	logger.InitLogger()
	rootCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	r := gin.New()
	gin.SetMode(gin.ReleaseMode)

	// init services
	db := initialize.InitMysql(rootCtx)
	redis := initialize.InitRedis(rootCtx)
	mqttClient, err := initialize.InitMqtt(rootCtx)
	if err != nil {
		logger.Log.Error("Failed to initialize MQTT", zap.Error(err))
	} else {
		defer mymqtt.Disconnect(mqttClient)
		mymqtt.Subscribe(mqttClient, "test", 1, func(client mqtt.Client, msg mqtt.Message) {
			logger.Log.Info("Received message",
				zap.String("topic", msg.Topic()),
				zap.String("payload", string(msg.Payload())))
		})
	}

	mailer_service := mailer.NewMailService(config.GetConfig().EmailConfig, logger.Log)

	routes.InitRouter(r, db, mailer_service, redis, rootCtx)

	socketHub := initialize.InitSocketServer(r)
	go socketHub.Run()

	if mqttClient != nil && socketHub != nil {
		bridge := brigde.NewBridge(mqttClient, socketHub)
		go bridge.GetSensorData(rootCtx)
	}

	go func() {
		if err := r.Run(":8080"); err != nil {
			logger.Log.Error("Gin server error", zap.Error(err))
		}
	}()
	<-rootCtx.Done()
	logger.Log.Info("Shutting down gracefully...")
}
