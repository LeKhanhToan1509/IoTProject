package initialize

import (
	"fmt"
	"iot/internal/config"
	"iot/internal/model"
	"iot/logger"
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
	})
	if err != nil {
		logger.LogDatabaseConnection("MySQL", dbConf.Host, false, err)
		panic(err)
	}

	logger.LogDatabaseConnection("MySQL", dbConf.Host, true, nil)
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
	logger.Info("Database connection pool configured")
}

func Migrate(db *gorm.DB) {
	models := []interface{}{
		&model.User{},
		&model.Device{},
		&model.SensorData{},
		&model.DeviceHistory{},
	}

	for _, model := range models {
		err := db.AutoMigrate(model)
		if err != nil {
			logger.LogDatabaseMigration(fmt.Sprintf("%T", model), false, err)
		} else {
			logger.LogDatabaseMigration(fmt.Sprintf("%T", model), true, nil)
		}
	}
}
