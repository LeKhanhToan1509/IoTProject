package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"iot/internal/dto"
	"iot/internal/model"
	"iot/internal/repository"
	mymqtt "iot/pkg/mqtt"
	"log"
	"sync"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type DeviceServiceInterface interface {
	CreateDevice(db *gorm.DB, deviceDto *dto.CreateDeviceRequest, redis *redis.Client) error
	GetByID(db *gorm.DB, id uint) (*model.Device, error)
	GetAllDevices(db *gorm.DB, limit, offset int, redis *redis.Client) ([]model.Device, error)
	UpdateDevice(db *gorm.DB, id uint, deviceDto *dto.UpdateDeviceRequest) error
	DeleteDevice(db *gorm.DB, id uint, redis *redis.Client) error
	DeviceController(ctx context.Context, db *gorm.DB, data *dto.DevicesControlRequest, mqtt mqtt.Client) error
}

type DeviceService struct {
	repo        repository.DeviceRepositoryInterface
	historyRepo repository.DeviceHistoryRepositoryInterface
}

func NewDeviceService(repo repository.DeviceRepositoryInterface, historyRepo repository.DeviceHistoryRepositoryInterface) DeviceServiceInterface {
	return &DeviceService{
		repo:        repo,
		historyRepo: historyRepo,
	}
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

func (s *DeviceService) UpdateDevice(db *gorm.DB, id uint, deviceDto *dto.UpdateDeviceRequest) error {
	device, err := s.repo.GetByID(db, id)
	if err != nil {
		return err
	}
	if deviceDto.Name != "" {
		device.Name = deviceDto.Name
	}
	device.Status = deviceDto.Status
	return s.repo.UpdateDevice(db, device)
}

func (s *DeviceService) DeleteDevice(db *gorm.DB, id uint, redis *redis.Client) error {
	return s.repo.DeleteDevice(db, id)
}

func (s *DeviceService) DeviceController(ctx context.Context, db *gorm.DB, data *dto.DevicesControlRequest, mqtt mqtt.Client) error {
	// Chuẩn bị danh sách devices từ request
	devices := []*dto.DeviceControlRequest{
		{DeviceID: data.Device1.DeviceID, Status: data.Device1.Status, UserId: data.Device1.UserId, UserChange: data.Device1.UserChange},
		{DeviceID: data.Device2.DeviceID, Status: data.Device2.Status, UserId: data.Device2.UserId, UserChange: data.Device2.UserChange},
		{DeviceID: data.Device3.DeviceID, Status: data.Device3.Status, UserId: data.Device3.UserId, UserChange: data.Device3.UserChange},
	}

	var wg sync.WaitGroup
	errCh := make(chan error, len(devices))
	dbWithCtx := db.WithContext(ctx)

	// Update song song các device
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

			deviceModel, err := s.repo.GetByID(dbWithCtx, d.DeviceID)
			if err != nil {
				errCh <- fmt.Errorf("get device %d: %w", d.DeviceID, err)
				return
			}

			if deviceModel.Status != d.Status {
				deviceModel.Status = d.Status
				if err := s.repo.UpdateDevice(dbWithCtx, deviceModel); err != nil {
					errCh <- fmt.Errorf("update device %d: %w", d.DeviceID, err)
					return
				}
				history := &model.DeviceHistory{
					UserID:     d.UserId,
					DeviceID:   d.DeviceID,
					UserChange: d.UserChange,
					Status:     d.Status,
				}
				if err := s.historyRepo.CreateDeviceHistory(dbWithCtx, history); err != nil {
					log.Printf("Failed to create history for device %d: %v", d.DeviceID, err)
				}
			}
		}(d)
	}

	wg.Wait()
	close(errCh)

	// Gom tất cả lỗi bằng errors.Join
	var errs []error
	for err := range errCh {
		if err != nil {
			errs = append(errs, err)
		}
	}
	if len(errs) > 0 {
		return errors.Join(errs...)
	}

	// Publish MQTT
	payloadJson := map[string]interface{}{
		"led1": data.Device1.Status,
		"led2": data.Device2.Status,
		"led3": data.Device3.Status,
	}
	payloadBytes, err := json.Marshal(payloadJson)
	if err != nil {
		return fmt.Errorf("marshal mqtt payload: %w", err)
	}

	mqttTopic := "devices/control"
	if err := mymqtt.Publish(mqtt, mqttTopic, 0, false, payloadBytes); err != nil {
		return fmt.Errorf("publish mqtt: %w", err)
	}

	return nil
}
