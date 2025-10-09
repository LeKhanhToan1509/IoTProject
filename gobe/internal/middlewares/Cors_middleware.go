package middlewares

import (
	"github.com/gin-gonic/gin"
)

func CorsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		// Danh sách origins cho phép (dev + prod)
		allowedOrigins := []string{
			"http://localhost:3000",
			"http://localhost:5173", // Vite port
			"http://127.0.0.1:3000",
			"http://127.0.0.1:5173",
			"https://yourdomain.com", // Thêm prod domain
		}

		// Check origin có trong list không
		originAllowed := false
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				originAllowed = true
				break
			}
		}

		// Nếu không match, default localhost:5173 (dev)
		if !originAllowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		}

		// Headers chung
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		// Handle preflight OPTIONS
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
