package model

import (
	"gorm.io/gorm"
)

type Device struct {
	gorm.Model
	Name   string `gorm:"column:name;type:varchar(50);notnull" json:"name"`
	Status string `gorm:"column:status;type:enum('ON','OFF');not null" json:"status"`
}

func (Device) TableName() string {
	return "devices"
}
