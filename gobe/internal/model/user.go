package model

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name          string `gorm:"column:name;type:varchar(100);not null"`
	Email         string `gorm:"column:email;type:varchar(100);not null;unique"`
	Password      string `gorm:"column:password;type:varchar(255);not null"`
}

func (User) TableName() string {
	return "users"
}
