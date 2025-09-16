package logger

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func GinLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Calculate request processing time
		end := time.Now()
		latency := end.Sub(start)

		// Get request info
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()
		bodySize := c.Writer.Size()
		userAgent := c.Request.UserAgent()

		if raw != "" {
			path = path + "?" + raw
		}

		// Log the request
		Log.Info("HTTP Request",
			zap.String("method", method),
			zap.String("path", path),
			zap.String("ip", clientIP),
			zap.Int("status", statusCode),
			zap.Int("size", bodySize),
			zap.Duration("latency", latency),
			zap.String("user_agent", userAgent),
		)
	}
}

// GinRecovery returns a gin.HandlerFunc (middleware) that recovers from panics and logs them.
func GinRecovery() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, err interface{}) {
		Log.Error("Panic recovered",
			zap.Any("error", err),
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.String("ip", c.ClientIP()),
		)
		c.AbortWithStatus(500)
	})
}
