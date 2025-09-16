package repository

import (
	"iot/internal/model"

	"gorm.io/gorm"
)

type SensorDataRepositoryInterface interface {
	Create(data *model.SensorData) (uint, error)
	GetByID(id uint) (*model.SensorData, error)
	GetAll(page, limit int) ([]model.SensorData, error)
	GetLatest() (*model.SensorData, error)
	Update(data *model.SensorData) error
	Delete(id uint) error
	GetCount() (int64, error)
}

type SensorDataRepository struct {
	db *gorm.DB
}

func NewSensorDataRepository(db *gorm.DB) SensorDataRepositoryInterface {
	return &SensorDataRepository{db: db}
}

func (r *SensorDataRepository) Create(data *model.SensorData) (uint, error) {
	return data.ID, r.db.Create(data).Error
}

func (r *SensorDataRepository) GetByID(id uint) (*model.SensorData, error) {
	var data model.SensorData
	err := r.db.First(&data, id).Error
	if err != nil {
		return nil, err
	}
	return &data, nil
}

func (r *SensorDataRepository) GetAll(page, limit int) ([]model.SensorData, error) {
	var data []model.SensorData
	offset := (page - 1) * limit

	err := r.db.Offset(offset).Limit(limit).Order("created_at desc").Find(&data).Error
	return data, err
}

func (r *SensorDataRepository) GetLatest() (*model.SensorData, error) {
	var data model.SensorData
	err := r.db.Order("created_at desc").First(&data).Error
	if err != nil {
		return nil, err
	}
	return &data, nil
}

func (r *SensorDataRepository) Update(data *model.SensorData) error {
	return r.db.Save(data).Error
}

func (r *SensorDataRepository) Delete(id uint) error {
	return r.db.Delete(&model.SensorData{}, id).Error
}

func (r *SensorDataRepository) GetCount() (int64, error) {
	var count int64
	err := r.db.Model(&model.SensorData{}).Count(&count).Error
	return count, err
}
