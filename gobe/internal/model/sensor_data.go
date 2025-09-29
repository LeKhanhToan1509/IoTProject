package model

import (
	"gorm.io/gorm"
)

type SensorData struct {
	gorm.Model
	Temperature float64 `gorm:"column:temperature;type:decimal(5,2);not null"`
	Humidity    float64 `gorm:"column:humidity;type:decimal(5,2);not null"`
	Light       int     `gorm:"column:light;type:int;not null"`
}

func (SensorData) TableName() string {
	return "sensor_data"
}
