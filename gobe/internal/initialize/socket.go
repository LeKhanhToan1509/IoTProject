package initialize

import (
	"iot/pkg/socket"
	"log"

	"github.com/gin-gonic/gin"
)

func InitSocketServer(r *gin.Engine) *socket.Hub {
	hub := socket.NewHub()

	r.GET("/ws", func(c *gin.Context) {
		socket.ServeWs(hub, c.Writer, c.Request)
	})

	log.Println("WebSocket server initialized on /ws endpoint")
	return hub
}
