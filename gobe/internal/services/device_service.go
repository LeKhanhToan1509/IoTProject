package services

import (
	"context"
	"encoding/json"
	"iot/internal/dto"
	"iot/internal/model"
	"iot/internal/repository"
	mymqtt "iot/pkg/mqtt"
	"sync"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type DeviceServiceInterface interface {
	CreateDevice(db *gorm.DB, deviceDto *dto.CreateDeviceRequest, redis *redis.Client) error
	GetByID(db *gorm.DB, id uint) (*model.Device, error)
	GetAllDevices(db *gorm.DB, limit, offset int, redis *redis.Client) ([]model.Device, error)
	UpdateDevice(db *gorm.DB, device *model.Device) error
	DeleteDevice(db *gorm.DB, id uint, redis *redis.Client) error
	DeviceController(ctx context.Context, db *gorm.DB, data *dto.DevicesControlRequest, mqtt mqtt.Client) error
}

type DeviceService struct {
	repo repository.DeviceRepositoryInterface
}

func NewDeviceService(repo repository.DeviceRepositoryInterface) DeviceServiceInterface {
	return &DeviceService{repo: repo}
}

func (s *DeviceService) CreateDevice(db *gorm.DB, deviceDto *dto.CreateDeviceRequest, redis *redis.Client) error {
	device := &model.Device{
		Name:   deviceDto.Name,
		Status: deviceDto.Status,
	}
	err := s.repo.CreateDevice(db, device)
	if err != nil {
		return err
	}
	return nil
}

func (s *DeviceService) GetByID(db *gorm.DB, id uint) (*model.Device, error) {
	return s.repo.GetByID(db, id)
}

func (s *DeviceService) GetAllDevices(db *gorm.DB, limit, offset int, redis *redis.Client) ([]model.Device, error) {
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.GetAllDevices(db, limit, offset)
}

func (s *DeviceService) UpdateDevice(db *gorm.DB, device *model.Device) error {
	return s.repo.UpdateDevice(db, device)
}

func (s *DeviceService) DeleteDevice(db *gorm.DB, id uint, redis *redis.Client) error {
	return s.repo.DeleteDevice(db, id)
}

func (s *DeviceService) DeviceController(ctx context.Context, db *gorm.DB, data *dto.DevicesControlRequest, mqtt mqtt.Client) error {
	devices := make([]*dto.DeviceControlRequest, 0)
	var wg sync.WaitGroup
	errCh := make(chan error, len(devices))

	for _, d := range devices {
		wg.Add(1)
		go func(d *dto.DeviceControlRequest) {
			defer wg.Done()

			select {
			case <-ctx.Done():
				errCh <- ctx.Err()
				return
			default:
			}

			deviceModel, err := s.repo.GetByID(db, d.DeviceID)
			if err != nil {
				errCh <- err
				return
			}

			deviceModel.Status = d.Status
			if err := s.repo.UpdateDevice(db, deviceModel); err != nil {
				errCh <- err
				return
			}
		}(d)
	}

	wg.Wait()
	close(errCh)

	for err := range errCh {
		if err != nil {
			return err
		}
	}

	mqttTopic := "devices/control"
	payloadJson := map[string]interface{}{
		"led1": data.Device1.Status,
		"led2": data.Device2.Status,
		"led3": data.Device3.Status,
	}
	payloadBytes, err := json.Marshal(payloadJson)
	if err != nil {
		return err
	}
	mqttErr := make(chan error, 1)
	go func() {
		if err := mymqtt.Publish(mqtt, mqttTopic, 0, false, payloadBytes); err != nil {
			mqttErr <- err
			return
		}
		mqttErr <- nil
	}()

	return <-mqttErr
}
