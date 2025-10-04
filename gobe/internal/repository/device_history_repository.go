package repository

import (
	"iot/internal/model"

	"gorm.io/gorm"
)

type DeviceHistoryRepositoryInterface interface {
	CreateDeviceHistory(db *gorm.DB, history *model.DeviceHistory) error
	GetByDeviceID(db *gorm.DB, deviceID uint) ([]model.DeviceHistory, error)
}

type DeviceHistoryRepository struct{}

func NewDeviceHistoryRepository() DeviceHistoryRepositoryInterface {
	return &DeviceHistoryRepository{}
}

func (r *DeviceHistoryRepository) CreateDeviceHistory(db *gorm.DB, history *model.DeviceHistory) error {
	return db.Create(history).Error
}

func (r *DeviceHistoryRepository) GetByDeviceID(db *gorm.DB, deviceID uint) ([]model.DeviceHistory, error) {
	var histories []model.DeviceHistory
	if err := db.Where("device_id = ?", deviceID).Find(&histories).Error; err != nil {
		return nil, err
	}
	return histories, nil
}
