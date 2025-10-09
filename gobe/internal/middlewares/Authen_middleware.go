package middlewares

import (
	"net/http"

	"iot/internal/jwt_utils"

	"github.com/gin-gonic/gin"
)

func Authen() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie("access_token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No access token found"})
			c.Abort()
			return
		}
		data, err := jwt_utils.VerifyToken(token, true)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("user", data)

		c.Next()
	}
}
