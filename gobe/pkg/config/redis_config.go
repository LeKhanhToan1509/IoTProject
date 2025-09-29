package config

import (
	"github.com/redis/go-redis/v9"
)

type RedisConfig struct {
	Host   string
	Port   string
	User   string
	Pass   string
	Dbname string
	DB     *redis.Client
}
