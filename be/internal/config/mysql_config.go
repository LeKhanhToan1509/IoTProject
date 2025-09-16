package config

import (
	"gorm.io/gorm"
)

type MysqlConfig struct {
	Host   string
	Port   string
	User   string
	Pass   string
	Dbname string
	DB     *gorm.DB
}
