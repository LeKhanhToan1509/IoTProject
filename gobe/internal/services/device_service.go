package services

import (
	"iot/internal/dto"
	"iot/internal/model"
	"iot/internal/repository"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type DeviceServiceInterface interface {
	CreateDevice(db *gorm.DB, deviceDto *dto.CreateDeviceRequest, redis *redis.Client) error
	GetByID(db *gorm.DB, id uint) (*model.Device, error)
	GetAllDevices(db *gorm.DB, limit, offset int, redis *redis.Client) ([]model.Device, error)
	UpdateDevice(db *gorm.DB, id uint, data *dto.UpdateDeviceRequest) error
	DeleteDevice(db *gorm.DB, id uint, redis *redis.Client) error
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

func (s *DeviceService) UpdateDevice(db *gorm.DB, id uint, data *dto.UpdateDeviceRequest) error {
	return s.repo.UpdateDevice(db, id)
}

func (s *DeviceService) DeleteDevice(db *gorm.DB, id uint, redis *redis.Client) error {
	return s.repo.DeleteDevice(db, id)
}

