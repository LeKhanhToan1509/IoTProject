package initialize

import (
	"context"
	"fmt"
	"iot/internal/cache"
	"iot/pkg/config"
	"log"

	"github.com/redis/go-redis/v9"
)

func SetupKeyRedis(cache *cache.KeyCache) {

}
func InitRedis(ctx context.Context) (*redis.Client, error) {
	cfg := config.GetConfig()
	redis_config := cfg.RedisConfig
	redis_address := fmt.Sprintf("%s:%s", redis_config.Host, redis_config.Port)
	rdb := redis.NewClient(&redis.Options{
		Addr:     redis_address,
		Password: redis_config.Pass,
		DB:       0,
	})

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Print(err)
	} else {
		log.Print(err)
	}

	redis_config.DB = rdb
	return rdb, nil
}
