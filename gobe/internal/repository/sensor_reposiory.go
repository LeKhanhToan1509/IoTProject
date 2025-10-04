package repository

import (
	"iot/internal/model"
	"time"

	"gorm.io/gorm"
)

type SensorRepositoryInterface interface {
	CreateSensorData(*gorm.DB, *model.SensorData) error
	DeleteSensorData(*gorm.DB, uint) error
	GetAllSensorData(*gorm.DB, int, int, string) ([]model.SensorData, error)
	GetLastSensorData(*gorm.DB) (*model.SensorData, error)
	GetSensorDataByID(*gorm.DB, uint) (*model.SensorData, error)
	GetSensorDataByTime(*gorm.DB, string) (*model.SensorData, error)
}

type SensorRepository struct{}

func NewSensorRepository() SensorRepositoryInterface {
	return &SensorRepository{}
}

func (r *SensorRepository) CreateSensorData(db *gorm.DB, data *model.SensorData) error {
	return db.Create(data).Error
}

func (r *SensorRepository) DeleteSensorData(db *gorm.DB, id uint) error {
	var data model.SensorData
	if err := db.First(&data, id).Error; err != nil {
		return err // không tìm thấy dữ liệu
	}
	return db.Unscoped().Delete(&data).Error
}

func (r *SensorRepository) GetAllSensorData(db *gorm.DB, limit, offset int, sort string) ([]model.SensorData, error) {
	var data []model.SensorData
	if err := db.Limit(limit).Offset(offset).Order(sort).Find(&data).Error; err != nil {
		return nil, err
	}
	return data, nil
}

func (r *SensorRepository) GetLastSensorData(db *gorm.DB) (*model.SensorData, error) {
	var data model.SensorData
	if err := db.Order("created_at desc").First(&data).Error; err != nil {
		return nil, err
	}
	return &data, nil
}

func (r *SensorRepository) GetSensorDataByID(db *gorm.DB, id uint) (*model.SensorData, error) {
	var data model.SensorData
	if err := db.First(&data, id).Error; err != nil {
		return nil, err
	}
	return &data, nil
}
func (r *SensorRepository) GetSensorDataByTime(db *gorm.DB, timestampStr string) (*model.SensorData, error) {
	// 1. Parse string thành time.Time
	layout := "15:04:05 02/01/2006" // định dạng của bạn
	t, err := time.Parse(layout, timestampStr)
	if err != nil {
		return nil, err
	}

	// 2. Query GORM
	var data model.SensorData
	if err := db.Where("timestamp = ?", t).First(&data).Error; err != nil {
		return nil, err
	}

	return &data, nil
}
