package repository

import (
	"iot/internal/model"

	"gorm.io/gorm"
)

type DeviceHistoryRepositoryInterface interface {
	Create(DeviceHistory *model.DeviceHistory) error
	GetAll(limit, offset int, orderBy string) ([]model.DeviceHistory, error)
	GetByID(id uint) (*model.DeviceHistory, error)
	GetByDeviceHistoryID(DeviceHistoryID string) (*model.DeviceHistory, error)
	Update(DeviceHistory *model.DeviceHistory) error
	Delete(id uint) error
}

type DeviceHistoryRepository struct {
	db *gorm.DB
}

func NewDeviceHistoryRepository(db *gorm.DB) DeviceHistoryRepositoryInterface {
	return &DeviceHistoryRepository{db: db}
}

func (repo *DeviceHistoryRepository) Create(deviceHistory *model.DeviceHistory) error {
	return repo.db.Create(deviceHistory).Error
}

func (repo *DeviceHistoryRepository) GetAll(limit, offset int, orderBy string) ([]model.DeviceHistory, error) {
	myDb := repo.db
	var histories []model.DeviceHistory
	query := myDb.Model(&model.DeviceHistory{})
	if limit > 0 {
		query.Limit(limit)
	}
	if offset > 0 && offset < 1000 {
		query.Offset(offset)
	}
	if orderBy == "" {
		orderBy = "id ASC"
	}
	query.Order(orderBy)
	err := query.Find(&histories).Error
	return histories, err
}

func (repo *DeviceHistoryRepository) GetByID(id uint) (*model.DeviceHistory, error) {
	var history *model.DeviceHistory
	query := repo.db.Model(&model.DeviceHistory{})
	err := query.First(&history, id).Error
	return history, err
}

func (repo *DeviceHistoryRepository) GetByDeviceHistoryID(deviceHistoryID string) (*model.DeviceHistory, error) {
	var history *model.DeviceHistory
	query := repo.db.Model(&model.DeviceHistory{})
	err := query.Where("device_id = ?", deviceHistoryID).First(&history).Error
	return history, err
}

func (repo *DeviceHistoryRepository) Update(deviceHistory *model.DeviceHistory) error {
	return repo.db.Save(deviceHistory).Error
}

func (repo *DeviceHistoryRepository) Delete(id uint) error {
	return repo.db.Delete(&model.DeviceHistory{}, id).Error
}
