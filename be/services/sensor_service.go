package services

import (
	"errors"
	"iot/internal/model"
	"iot/internal/repository"
)

type SensorServiceInterface interface {
	CreateSensorData(temperature, humidity float64, light int) (uint, error)
	GetAllSensorData(page, limit int) ([]model.SensorData, error)
	GetSensorDataByID(id uint) (*model.SensorData, error)
	GetLatestSensorData() (*model.SensorData, error)
	UpdateSensorData(data *model.SensorData) error
	DeleteSensorData(id uint) error
	GetSensorDataCount() (int64, error)
}

type SensorService struct {
	sensorRepo repository.SensorDataRepositoryInterface
}

func NewSensorService(sensorRepo repository.SensorDataRepositoryInterface) SensorServiceInterface {
	return &SensorService{sensorRepo: sensorRepo}
}

func (s *SensorService) CreateSensorData(temperature, humidity float64, light int) (uint, error) {
	// Validate input ranges
	if temperature < -50 || temperature > 100 {
		return 0, errors.New("temperature must be between -50 and 100 degrees Celsius")
	}
	if humidity < 0 || humidity > 100 {
		return 0, errors.New("humidity must be between 0 and 100 percent")
	}
	if light < 0 || light > 100000 {
		return 0, errors.New("light value must be between 0 and 100000 lux")
	}

	data := &model.SensorData{
		Temperature: temperature,
		Humidity:    humidity,
		Light:       light,
	}

	return s.sensorRepo.Create(data)
}

func (s *SensorService) GetAllSensorData(page, limit int) ([]model.SensorData, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 10
	}

	return s.sensorRepo.GetAll(page, limit)
}

func (s *SensorService) GetSensorDataByID(id uint) (*model.SensorData, error) {
	if id == 0 {
		return nil, errors.New("invalid sensor data ID")
	}
	return s.sensorRepo.GetByID(id)
}

func (s *SensorService) GetLatestSensorData() (*model.SensorData, error) {
	return s.sensorRepo.GetLatest()
}

func (s *SensorService) UpdateSensorData(data *model.SensorData) error {
	if data == nil {
		return errors.New("sensor data cannot be nil")
	}
	if data.ID == 0 {
		return errors.New("sensor data ID is required")
	}

	// Validate ranges
	if data.Temperature < -50 || data.Temperature > 100 {
		return errors.New("temperature must be between -50 and 100 degrees Celsius")
	}
	if data.Humidity < 0 || data.Humidity > 100 {
		return errors.New("humidity must be between 0 and 100 percent")
	}
	if data.Light < 0 || data.Light > 100000 {
		return errors.New("light value must be between 0 and 100000 lux")
	}

	return s.sensorRepo.Update(data)
}

func (s *SensorService) DeleteSensorData(id uint) error {
	if id == 0 {
		return errors.New("invalid sensor data ID")
	}

	_, err := s.sensorRepo.GetByID(id)
	if err != nil {
		return errors.New("sensor data not found")
	}

	return s.sensorRepo.Delete(id)
}

func (s *SensorService) GetSensorDataCount() (int64, error) {
	return s.sensorRepo.GetCount()
}
