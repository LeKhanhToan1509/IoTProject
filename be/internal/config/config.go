package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DbConfig *MysqlConfig
}

func GetConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Print("env not found")
	}

	return &Config{
		DbConfig: &MysqlConfig{
			Host:   os.Getenv("MYSQL_HOST"),
			Port:   os.Getenv("MYSQL_PORT"),
			User:   os.Getenv("MYSQL_USER"),
			Pass:   os.Getenv("MYSQL_PASS"),
			Dbname: os.Getenv("MYSQL_DBNAME"),
		},
	}
}
