package dto

type CreateDeviceRequest struct {
	Name   string `json:"name" binding:"required"`
	Status string `json:"status" binding:"required,oneof=ON OFF"`
}

type UpdateDeviceRequest struct {
	Name   string `json:"name"`
	Status string `json:"status" binding:"required,oneof=ON OFF"`
}
type DeviceControlRequest struct {
	DeviceID uint   `json:"device_id" binding:"required"`
	Status   string `json:"status" binding:"required,oneof=ON OFF"`
	UserId   uint   `json:"user_id" binding:"required"`
}
type DevicesControlRequest struct {
	Device1 DeviceControlRequest `json:"device1" binding:"required"`
	Device2 DeviceControlRequest `json:"device2" binding:"required"`
	Device3 DeviceControlRequest `json:"device3" binding:"required"`
}

type DevicesControl struct {
}
