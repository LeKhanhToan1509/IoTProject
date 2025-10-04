package dto

type CreateDeviceHistoryRequest struct {
	UserID     uint   `json:"user_id" binding:"required"`
	DeviceID   uint   `json:"device_id" binding:"required"`
	UserChange string `json:"user_change" binding:"required"`
	Status     string `json:"status" binding:"required,oneof=ON OFF"`
}
