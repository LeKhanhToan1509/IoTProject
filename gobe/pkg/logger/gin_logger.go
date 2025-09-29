package logger

import (
	"runtime/debug"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

var (
	Log   *zap.Logger
	Sugar *zap.SugaredLogger
)

func InitLogger() {
	var err error
	Log, err = zap.NewProduction()
	if err != nil {
		panic(err)
	}
	Sugar = Log.Sugar()
}

func GinLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		latency := time.Since(start)

		Log.Info("HTTP request",
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", c.Writer.Status()),
			zap.String("client_ip", c.ClientIP()),
			zap.String("user_agent", c.Request.UserAgent()),
			zap.Duration("latency", latency),
		)
	}
}

func GinRecovery(stack bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				if stack {
					Log.Error("Panic recovered",
						zap.Any("error", err),
						zap.ByteString("stack", debug.Stack()),
					)
				} else {
					Log.Error("Panic recovered", zap.Any("error", err))
				}
				c.AbortWithStatus(500)
			}
		}()
		c.Next()
	}
}
