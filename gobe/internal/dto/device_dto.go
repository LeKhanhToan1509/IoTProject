package dto

type CreateDeviceRequest struct {
	Name   string `json:"name" binding:"required"`
	Status string `json:"status" binding:"required,oneof=ON OFF"`
}

type UpdateDeviceRequest struct {
	Name   string `json:"name"`
	Status string `json:"status" binding:"required,oneof=ON OFF"`
}
