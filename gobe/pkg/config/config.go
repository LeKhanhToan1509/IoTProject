package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DbConfig    *MysqlConfig
	RedisConfig *RedisConfig
	EmailConfig *EmailConfig
	MQTTConfig  *MQTTConfig
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
		RedisConfig: &RedisConfig{
			Host:   os.Getenv("REDIS_HOST"),
			Port:   os.Getenv("REDIS_PORT"),
			User:   os.Getenv("REDIS_USER"),
			Pass:   os.Getenv("REDIS_PASS"),
			Dbname: os.Getenv("REDIS_DBNAME"),
		},
		EmailConfig: &EmailConfig{
			Host:     os.Getenv("SMTP_HOST"),
			Port:     587,
			Username: os.Getenv("SMTP_USERNAME"),
			Password: os.Getenv("SMTP_PASSWORD"),
			From:     os.Getenv("FROM_EMAIL"),
			Timeout:  30,    // Increased timeout for SMTP
			UseTLS:   false, // Enable TLS for Gmail
		},
		MQTTConfig: &MQTTConfig{
			Broker:       os.Getenv("MQTT_BROKER"),
			ClientID:     os.Getenv("MQTT_CLIENT_ID"),
			Username:     os.Getenv("MQTT_USERNAME"),
			Password:     os.Getenv("MQTT_PASSWORD"),
			DefaultTopic: os.Getenv("MQTT_DEFAULT_TOPIC"),
			QoS:          1,
		},
	}
}
