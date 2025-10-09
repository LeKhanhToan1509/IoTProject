package dto

type CreateDeviceHistoryRequest struct {
	UserID     string `json:"user_id" binding:"required"`
	DeviceID   string `json:"device_id" binding:"required"`
	UserChange string `json:"user_change" binding:"required"`
	Status     string `json:"status" binding:"required,oneof=ON OFF"`
}
