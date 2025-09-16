package services

import (
	"errors"
	"iot/internal/model"
	"iot/internal/repository"
)

type DeviceServiceInterface interface {
	CreateDevice(name, status string) error
	GetAllDevices() ([]model.Device, error)
	GetDeviceByID(id uint) (*model.Device, error)
	GetDeviceByDeviceID(deviceID string) (*model.Device, error)
	UpdateDeviceStatus(deviceID string, status string) error
	DeleteDevice(id uint) error
}

type DeviceService struct {
	deviceRepo repository.DeviceRepositoryInterface
}

func NewDeviceService(deviceRepo repository.DeviceRepositoryInterface) DeviceServiceInterface {
	return &DeviceService{deviceRepo: deviceRepo}
}

func (s *DeviceService) CreateDevice(name, status string) error {
	if name == "" {
		return errors.New("invalid name")
	}

	if status == "" {
		return errors.New("invalid status")
	}
	return s.deviceRepo.Create(&model.Device{
		Name:   name,
		Status: status,
	})
}

func (s *DeviceService) GetAllDevices() ([]model.Device, error) {
	return s.deviceRepo.GetAll()
}

func (s *DeviceService) GetDeviceByID(id uint) (*model.Device, error) {
	return s.deviceRepo.GetByID(id)
}

func (s *DeviceService) GetDeviceByDeviceID(deviceID string) (*model.Device, error) {
	return s.deviceRepo.GetByDeviceID(deviceID)
}

func (s *DeviceService) UpdateDeviceStatus(deviceID string, status string) error {
	if status != "ON" && status != "OFF" {
		return errors.New("invalid status, must be ON or OFF")
	}
	device, err := s.deviceRepo.GetByDeviceID(deviceID)
	if err != nil {
		return errors.New("device not found")
	}

	if device == nil {
		return errors.New("device not found")
	}

	return s.deviceRepo.UpdateStatus(deviceID, status)
}

func (s *DeviceService) DeleteDevice(id uint) error {
	device, err := s.deviceRepo.GetByID(id)
	if err != nil {
		return errors.New("device not found")
	}

	if device == nil {
		return errors.New("device not found")
	}

	return s.deviceRepo.Delete(id)
}
