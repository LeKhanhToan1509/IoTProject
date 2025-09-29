package middlewares

import (
	"iot/internal/jwt_utils"

	"github.com/gin-gonic/gin"
)

func Authen(c *gin.Context) *gin.HandlerFunc {
	header := c.GetHeader("Authorization")
	if header == "" {
		return nil
	}

	header = header[7:] // remove "Bearer "

	data, err := jwt_utils.VerifyToken(header, true)
	if err != nil {
		return nil
	}
	c.Set("user", data)

	return nil
}
