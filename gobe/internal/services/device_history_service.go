package services

import (
	"iot/internal/dto"
	"iot/internal/model"
	"iot/internal/repository"

	"gorm.io/gorm"
)

type DeviceHistoryServiceInterface interface {
	RecordDeviceHistory(db *gorm.DB, req dto.CreateDeviceHistoryRequest) error
	GetDeviceHistoryByDeviceID(db *gorm.DB, deviceID uint) ([]model.DeviceHistory, error)
}

type DeviceHistoryService struct {
	repo repository.DeviceHistoryRepositoryInterface
}

func NewDeviceHistoryService(repo repository.DeviceHistoryRepositoryInterface) DeviceHistoryServiceInterface {
	return &DeviceHistoryService{
		repo: repo,
	}
}

func (s *DeviceHistoryService) RecordDeviceHistory(db *gorm.DB, req dto.CreateDeviceHistoryRequest) error {
	history := &model.DeviceHistory{
		DeviceID:   req.DeviceID,
		UserID:     req.UserID,
		Status:     req.Status,
		UserChange: req.UserChange,
	}
	return s.repo.CreateDeviceHistory(db, history)
}

func (s *DeviceHistoryService) GetDeviceHistoryByDeviceID(db *gorm.DB, deviceID uint) ([]model.DeviceHistory, error) {
	return s.repo.GetByDeviceID(db, deviceID)
}
