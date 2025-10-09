package model

import (
	"gorm.io/gorm"
)

type DeviceHistory struct {
	gorm.Model
	UserID     uint   `gorm:"column:user_id;not null"`
	DeviceID   uint   `gorm:"column:device_id;type:varchar(50);not null"`
	UserChange string `gorm:"column:user_change;type:varchar(100);not null"`
	Status     string `gorm:"column:status;type:enum('ON','OFF');not null"`
}

func (DeviceHistory) TableName() string {
	return "device_histories"
}
