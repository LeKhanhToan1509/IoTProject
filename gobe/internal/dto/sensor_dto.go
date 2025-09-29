package dto

type CreateSensorDTO struct {
	Temperature float64 `json:"temperature" binding:"required"`
	Humidity    float64 `json:"humidity" binding:"required"`
	Light       int     `json:"light" binding:"required"`
}
