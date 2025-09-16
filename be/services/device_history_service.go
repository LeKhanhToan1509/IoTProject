package services

import (
	"errors"
	"iot/internal/model"
	"iot/internal/repository"
	"strings"
)

type DeviceHistoryServiceInterface interface {
	CreateDeviceHistory(userID uint, deviceID, userChange, status string) error
	GetAllDeviceHistories(limit, offset int, orderBy string) ([]model.DeviceHistory, error)
	GetDeviceHistoryByID(id uint) (*model.DeviceHistory, error)
	GetDeviceHistoryByDeviceID(deviceID string) (*model.DeviceHistory, error)
	UpdateDeviceHistory(history *model.DeviceHistory) error
	DeleteDeviceHistory(id uint) error
}

type DeviceHistoryService struct {
	deviceHistoryRepo repository.DeviceHistoryRepositoryInterface
	deviceRepo        repository.DeviceRepositoryInterface
	userRepo          repository.UserRepositoryInterface
}

func NewDeviceHistoryService(
	deviceHistoryRepo repository.DeviceHistoryRepositoryInterface,
	deviceRepo repository.DeviceRepositoryInterface,
	userRepo repository.UserRepositoryInterface,
) DeviceHistoryServiceInterface {
	return &DeviceHistoryService{
		deviceHistoryRepo: deviceHistoryRepo,
		deviceRepo:        deviceRepo,
		userRepo:          userRepo,
	}
}

func (s *DeviceHistoryService) CreateDeviceHistory(userID uint, deviceID, userChange, status string) error {
	// Validate input
	if userID == 0 {
		return errors.New("user ID is required")
	}
	if strings.TrimSpace(deviceID) == "" {
		return errors.New("device ID is required")
	}
	if strings.TrimSpace(userChange) == "" {
		return errors.New("user change description is required")
	}
	if status != "ON" && status != "OFF" {
		return errors.New("status must be 'ON' or 'OFF'")
	}

	// Verify user exists
	_, err := s.userRepo.GetByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	// Verify device exists
	_, err = s.deviceRepo.GetByDeviceID(deviceID)
	if err != nil {
		return errors.New("device not found")
	}

	history := &model.DeviceHistory{
		UserID:     userID,
		DeviceID:   strings.TrimSpace(deviceID),
		UserChange: strings.TrimSpace(userChange),
		Status:     status,
	}

	return s.deviceHistoryRepo.Create(history)
}

func (s *DeviceHistoryService) GetAllDeviceHistories(limit, offset int, orderBy string) ([]model.DeviceHistory, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	if orderBy == "" {
		orderBy = "created_at DESC"
	}

	return s.deviceHistoryRepo.GetAll(limit, offset, orderBy)
}

func (s *DeviceHistoryService) GetDeviceHistoryByID(id uint) (*model.DeviceHistory, error) {
	if id == 0 {
		return nil, errors.New("invalid device history ID")
	}
	return s.deviceHistoryRepo.GetByID(id)
}

func (s *DeviceHistoryService) GetDeviceHistoryByDeviceID(deviceID string) (*model.DeviceHistory, error) {
	if strings.TrimSpace(deviceID) == "" {
		return nil, errors.New("device ID is required")
	}
	return s.deviceHistoryRepo.GetByDeviceHistoryID(strings.TrimSpace(deviceID))
}

func (s *DeviceHistoryService) UpdateDeviceHistory(history *model.DeviceHistory) error {
	if history == nil {
		return errors.New("device history cannot be nil")
	}
	if history.ID == 0 {
		return errors.New("device history ID is required")
	}
	if history.UserID == 0 {
		return errors.New("user ID is required")
	}
	if strings.TrimSpace(history.DeviceID) == "" {
		return errors.New("device ID is required")
	}
	if strings.TrimSpace(history.UserChange) == "" {
		return errors.New("user change description is required")
	}
	if history.Status != "ON" && history.Status != "OFF" {
		return errors.New("status must be 'ON' or 'OFF'")
	}

	return s.deviceHistoryRepo.Update(history)
}

func (s *DeviceHistoryService) DeleteDeviceHistory(id uint) error {
	if id == 0 {
		return errors.New("invalid device history ID")
	}

	// Check if exists
	_, err := s.deviceHistoryRepo.GetByID(id)
	if err != nil {
		return errors.New("device history not found")
	}

	return s.deviceHistoryRepo.Delete(id)
}
