package services

import (
	"context"
	"encoding/json"
	"iot/internal/dto"
	"iot/internal/model"
	"iot/internal/repository"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type SensorServiceInterface interface {
	CreateSensorData(*gorm.DB, *dto.CreateSensorDTO, *redis.Client) error
	GetAllSensorData(*gorm.DB, int, int, string) ([]model.SensorData, error)
	DeleteSensorData(*gorm.DB, uint) error
	GetSensorDataByID(*gorm.DB, uint) (*model.SensorData, error)
	GetSensorDataByTime(*gorm.DB, string) (*model.SensorData, error)
	GetLastSensorData(*gorm.DB, *redis.Client, context.Context) (*model.SensorData, error)
}

type sensorService struct {
	repo repository.SensorRepositoryInterface
}

func NewSensorService(repo repository.SensorRepositoryInterface) SensorServiceInterface {
	return &sensorService{
		repo: repo,
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

func (s *sensorService) GetAllSensorData(db *gorm.DB, limit, offset int, sort string) ([]model.SensorData, error) {
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	if sort == "" {
		sort = "created_at desc"
	}
	return s.repo.GetAllSensorData(db, limit, offset, sort)
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

func (s *sensorService) GetLastSensorData(db *gorm.DB, redis *redis.Client, ctx context.Context) (*model.SensorData, error) {
	if data, err := redis.Get(ctx, "last_sensor_data").Result(); err == nil {
		var sensorData model.SensorData
		if err := json.Unmarshal([]byte(data), &sensorData); err == nil {
			return &sensorData, nil
		}
	}

	data, err := s.repo.GetLastSensorData(db)
	if err != nil {
		return nil, err
	}

	if bytes, err := json.Marshal(data); err == nil {
		redis.Set(ctx, "last_sensor_data", bytes, 2*time.Second)
	}

	return data, nil
}
