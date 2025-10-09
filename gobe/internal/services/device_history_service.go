package services

import (
	"fmt"
	"iot/internal/dto"
	"iot/internal/model"
	"iot/internal/repository"

	"gorm.io/gorm"
)

type DeviceHistoryServiceInterface interface {
	CreateDeviceHistory(db *gorm.DB, req dto.CreateDeviceHistoryRequest) (*model.DeviceHistory, error)
	GetDeviceHistoryByDeviceID(db *gorm.DB, deviceID uint) (*model.DeviceHistory, error)
	GetAllDeviceHistories(db *gorm.DB, limit int, offset int, order string, status string, deviceId string, startDate string, endDate string, search string) ([]model.DeviceHistory, int, error)
}

type DeviceHistoryService struct {
	repo repository.DeviceHistoryRepositoryInterface
}

func NewDeviceHistoryService(repo repository.DeviceHistoryRepositoryInterface) DeviceHistoryServiceInterface {
	return &DeviceHistoryService{
		repo: repo,
	}
}

func (s *DeviceHistoryService) CreateDeviceHistory(db *gorm.DB, req dto.CreateDeviceHistoryRequest) (*model.DeviceHistory, error) {
	DeviceIdUint := uint(0)
	UserIdUint := uint(0)
	_, err := fmt.Sscan(req.DeviceID, &DeviceIdUint)
	if err != nil {
		return nil, err
	}
	_, err = fmt.Sscan(req.UserID, &UserIdUint)
	if err != nil {
		return nil, err
	}
	history := &model.DeviceHistory{
		DeviceID:   DeviceIdUint,
		UserID:     UserIdUint,
		Status:     req.Status,
		UserChange: req.UserChange,
	}

	return history, s.repo.CreateDeviceHistory(db, history)
}

func (s *DeviceHistoryService) GetDeviceHistoryByDeviceID(db *gorm.DB, deviceID uint) (*model.DeviceHistory, error) {
	return s.repo.GetByDeviceID(db, deviceID)
}

func (s *DeviceHistoryService) GetAllDeviceHistories(db *gorm.DB, limit int, offset int, order string, status string, deviceId string, startDate string, endDate string, search string) ([]model.DeviceHistory, int, error) {
	return s.repo.GetAllDeviceHistories(db, limit, offset, order, status, deviceId, startDate, endDate, search)
}
