package services

import (
	"iot/internal/repository"
)

type ServiceContainer struct {
	UserService          UserServiceInterface
	DeviceService        DeviceServiceInterface
	SensorService        SensorServiceInterface
	DeviceHistoryService DeviceHistoryServiceInterface
}

func NewServiceContainer(
	userRepo repository.UserRepositoryInterface,
	deviceRepo repository.DeviceRepositoryInterface,
	sensorRepo repository.SensorDataRepositoryInterface,
	deviceHistoryRepo repository.DeviceHistoryRepositoryInterface,
) *ServiceContainer {
	return &ServiceContainer{
		UserService:          NewUserService(userRepo),
		DeviceService:        NewDeviceService(deviceRepo),
		SensorService:        NewSensorService(sensorRepo),
		DeviceHistoryService: NewDeviceHistoryService(deviceHistoryRepo, deviceRepo, userRepo),
	}
}
