package repository

import (
	"iot/internal/model"

	"gorm.io/gorm"
)

type DeviceRepositoryInterface interface {
	CreateDevice(db *gorm.DB, device *model.Device) error
	GetByID(db *gorm.DB, id uint) (*model.Device, error)
	GetAllDevices(db *gorm.DB, limit, offset int) ([]model.Device, error)
	UpdateDevice(db *gorm.DB, device *model.Device) error
	DeleteDevice(db *gorm.DB, id uint) error
}

type DeviceRepository struct{}

func NewDeviceRepository() DeviceRepositoryInterface {
	return &DeviceRepository{}
}

// CreateDevice - tạo device mới
func (r *DeviceRepository) CreateDevice(db *gorm.DB, device *model.Device) error {
	return db.Create(device).Error
}

// GetByID - tìm device theo ID
func (r *DeviceRepository) GetByID(db *gorm.DB, id uint) (*model.Device, error) {
	var device model.Device
	if err := db.First(&device, id).Error; err != nil {
		return nil, err
	}
	return &device, nil
}

// GetAllDevices - lấy tất cả device với phân trang
func (r *DeviceRepository) GetAllDevices(db *gorm.DB, limit, offset int) ([]model.Device, error) {
	var devices []model.Device
	if err := db.Limit(limit).Offset(offset).Find(&devices).Error; err != nil {
		return nil, err
	}
	return devices, nil
}

// UpdateDevice - cập nhật device theo ID
func (r *DeviceRepository) UpdateDevice(db *gorm.DB, device *model.Device) error {
	if err := db.First(&device, device.ID).Error; err != nil {
		return err 
	}
	return db.Save(&device).Error
}

// DeleteDevice - xóa device theo ID
func (r *DeviceRepository) DeleteDevice(db *gorm.DB, id uint) error {
	var device model.Device
	if err := db.First(&device, id).Error; err != nil {
		return err // không tìm thấy device
	}
	return db.Unscoped().Delete(&device).Error
}
