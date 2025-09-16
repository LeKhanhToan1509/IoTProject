package repository

import (
	"fmt"
	"iot/internal/model"

	"gorm.io/gorm"
)

type DeviceRepositoryInterface interface {
	Create(device *model.Device) error
	GetAll() ([]model.Device, error)
	GetByID(id uint) (*model.Device, error)
	GetByDeviceID(deviceID string) (*model.Device, error)
	Update(device *model.Device) error
	Delete(id uint) error
	UpdateStatus(deviceID string, status string) error
}

type DeviceRepository struct {
	db *gorm.DB
}

func NewDeviceRepository(db *gorm.DB) DeviceRepositoryInterface {
	return &DeviceRepository{db: db}
}

func (r *DeviceRepository) Create(device *model.Device) error {
	return r.db.Create(device).Error
}

func (r *DeviceRepository) GetAll() ([]model.Device, error) {
	var devices []model.Device
	err := r.db.Find(&devices).Error
	return devices, err
}

func (r *DeviceRepository) GetByID(id uint) (*model.Device, error) {
	var device model.Device
	err := r.db.First(&device, id).Error
	if err != nil {
		return nil, err
	}
	return &device, nil
}

func (r *DeviceRepository) GetByDeviceID(deviceID string) (*model.Device, error) {
	var device model.Device
	// Convert string ID to uint since Device model uses ID field
	var id uint
	if _, err := fmt.Sscanf(deviceID, "%d", &id); err != nil {
		return nil, err
	}
	err := r.db.First(&device, id).Error
	if err != nil {
		return nil, err
	}
	return &device, nil
}

func (r *DeviceRepository) Update(device *model.Device) error {
	return r.db.Save(device).Error
}

func (r *DeviceRepository) Delete(id uint) error {
	return r.db.Delete(&model.Device{}, id).Error
}

func (r *DeviceRepository) UpdateStatus(deviceID string, status string) error {
	// Convert string ID to uint
	var id uint
	if _, err := fmt.Sscanf(deviceID, "%d", &id); err != nil {
		return err
	}
	return r.db.Model(&model.Device{}).Where("id = ?", id).Update("status", status).Error
}
