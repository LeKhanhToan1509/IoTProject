package bridge

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"iot/internal/dto"
	"iot/internal/services"
	"iot/pkg/logger"
	"iot/pkg/socket"
	"strconv"
	"sync"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type mqttSocketBridge struct {
	mqtt      mqtt.Client
	socketHub *socket.Hub
	redis     *redis.Client
	db        *gorm.DB
	service   services.SensorServiceInterface
	wg        sync.WaitGroup
}

func NewMqttSocketBridge(
	mqttClient mqtt.Client,
	socketHub *socket.Hub,
	redis *redis.Client,
	db *gorm.DB,
	service services.SensorServiceInterface,
) *mqttSocketBridge {
	return &mqttSocketBridge{
		mqtt:      mqttClient,
		socketHub: socketHub,
		redis:     redis,
		db:        db,
		service:   service,
	}
}

func (b *mqttSocketBridge) SubscribeSensorData(ctx context.Context) error {
	if !b.mqtt.IsConnected() {
		return errors.New("MQTT client not connected")
	}

	topic := "sensor/information"
	token := b.mqtt.Subscribe(topic, 0, b.handleSensorMessage(ctx))
	token.Wait()

	if err := token.Error(); err != nil {
		logger.Log.Error("Failed to subscribe", zap.String("topic", topic), zap.Error(err))
		return err
	}

	logger.Log.Info("Subscribed to topic", zap.String("topic", topic))

	<-ctx.Done()
	logger.Log.Info("Shutdown signal received, waiting for pending operations...")

	// Đợi tất cả goroutines với timeout
	done := make(chan struct{})
	go func() {
		b.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		logger.Log.Info("All pending operations completed")
	case <-time.After(10 * time.Second):
		logger.Log.Warn("Shutdown timeout exceeded, some operations may be incomplete")
	}

	// Unsubscribe
	if token := b.mqtt.Unsubscribe(topic); token.Wait() && token.Error() != nil {
		logger.Log.Error("Failed to unsubscribe", zap.Error(token.Error()))
		return token.Error()
	}

	logger.Log.Info("Unsubscribed from topic", zap.String("topic", topic))
	return nil
}

func (b *mqttSocketBridge) handleSensorMessage(ctx context.Context) mqtt.MessageHandler {
	return func(client mqtt.Client, msg mqtt.Message) {
		payload := msg.Payload()

		// Debug log - track MQTT messages and WebSocket clients
		logger.Log.Info("MQTT message received",
			zap.String("topic", msg.Topic()),
			zap.ByteString("payload", payload),
			zap.Int("websocket_clients", len(b.socketHub.Clients)))

		select {
		case b.socketHub.Broadcast <- payload:
			logger.Log.Info("Message broadcasted to WebSocket clients",
				zap.Int("client_count", len(b.socketHub.Clients)))
		default:
			logger.Log.Warn("Broadcast channel full, message dropped")
		}

		// Parse sensor data
		var data map[string]interface{}
		if err := json.Unmarshal(payload, &data); err != nil {
			logger.Log.Error("Invalid sensor payload", zap.Error(err))
			return
		}

		dataSensor, err := b.parseSensorData(data)
		if err != nil {
			logger.Log.Error("Invalid sensor values", zap.Error(err), zap.Any("data", data))
			return
		}

		b.wg.Add(1)
		go b.saveSensorData(ctx, dataSensor)
	}
}

func (b *mqttSocketBridge) parseSensorData(data map[string]interface{}) (*dto.CreateSensorDTO, error) {
	temp, err := strconv.ParseFloat(fmt.Sprint(data["temperature"]), 64)
	if err != nil {
		return nil, fmt.Errorf("invalid temperature: %w", err)
	}

	hum, err := strconv.ParseFloat(fmt.Sprint(data["humidity"]), 64)
	if err != nil {
		return nil, fmt.Errorf("invalid humidity: %w", err)
	}

	light, err := strconv.Atoi(fmt.Sprint(data["light_raw"]))
	if err != nil {
		return nil, fmt.Errorf("invalid light: %w", err)
	}

	return &dto.CreateSensorDTO{
		Temperature: temp,
		Humidity:    hum,
		Light:       light,
	}, nil
}

func (b *mqttSocketBridge) saveSensorData(ctx context.Context, data *dto.CreateSensorDTO) {
	defer b.wg.Done()

	saveCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := b.service.CreateSensorData(b.db, data, b.redis); err != nil {
		if errors.Is(err, context.Canceled) || errors.Is(saveCtx.Err(), context.DeadlineExceeded) {
			logger.Log.Warn("Save operation cancelled or timed out")
			return
		}
		logger.Log.Error("Failed to save sensor data", zap.Error(err))
	} else {
		logger.Log.Info("Sensor data saved successfully")
	}
}
