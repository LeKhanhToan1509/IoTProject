package services

import (
	"iot/internal/dto"
	"iot/internal/model"
	"iot/internal/repository"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type SensorServiceInterface interface {
	CreateSensorData(*gorm.DB, *dto.CreateSensorDTO, *redis.Client) error
	GetAllSensorData(*gorm.DB, int, int) ([]model.SensorData, error)
	DeleteSensorData(*gorm.DB, uint) error
	GetSensorDataByID(*gorm.DB, uint) (*model.SensorData, error)
	GetSensorDataByTime(*gorm.DB, string) (*model.SensorData, error)
}

type sensorService struct {
	repo repository.SensorRepositoryInterface
}

func NewSensorService() SensorServiceInterface {
	return &sensorService{
		repo: repository.NewSensorRepository(),
	}
}
func (s *sensorService) CreateSensorData(db *gorm.DB, dto *dto.CreateSensorDTO, redis *redis.Client) error {
	sensorData := &model.SensorData{
		Temperature: dto.Temperature,
		Humidity:    dto.Humidity,
		Light:       dto.Light,
	}
	return s.repo.CreateSensorData(db, sensorData)
}

func (s *sensorService) GetAllSensorData(db *gorm.DB, limit, offset int) ([]model.SensorData, error) {
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.GetAllSensorData(db, limit, offset)
}

func (s *sensorService) DeleteSensorData(db *gorm.DB, id uint) error {
	return s.repo.DeleteSensorData(db, id)
}

func (s *sensorService) GetSensorDataByID(db *gorm.DB, id uint) (*model.SensorData, error) {
	return s.repo.GetSensorDataByID(db, id)
}

func (s *sensorService) GetSensorDataByTime(db *gorm.DB, timestampStr string) (*model.SensorData, error) {
	return s.repo.GetSensorDataByTime(db, timestampStr)
}
