package initialize

import (
	"fmt"
	"iot/internal/model"
	"iot/pkg/config"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func InitMysql() *gorm.DB {
	cfg := config.GetConfig()
	dbConf := cfg.DbConfig

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbConf.User,
		dbConf.Pass,
		dbConf.Host,
		dbConf.Port,
		dbConf.Dbname,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		SkipDefaultTransaction: false,
		TranslateError:         true,
	})
	if err != nil {
		panic(err)
	}

	dbConf.DB = db

	setPool(db)
	Migrate(db)

	return db
}

func setPool(db *gorm.DB) {
	sqlDB, _ := db.DB()
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(time.Hour)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxIdleTime(10 * time.Minute)
}

func Migrate(db *gorm.DB) {
	models := []interface{}{
		&model.User{},
		&model.Device{},
		&model.SensorData{},
		&model.DeviceHistory{},
	}

	for _, model := range models {
		db.AutoMigrate(model)
	}
}
