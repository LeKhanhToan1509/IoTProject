package routes

import (
	"iot/internal/handler"

	"github.com/gin-gonic/gin"
)

// SetupUserRoutes sets up user routes
func SetupUserRoutes(api *gin.RouterGroup, userHandler *handler.UserHandler) {
	userRoutes := api.Group("/users")
	{
		userRoutes.POST("", userHandler.CreateUser)       // POST /api/users
		userRoutes.GET("", userHandler.GetAllUsers)       // GET /api/users
		userRoutes.GET("/:id", userHandler.GetUserByID)   // GET /api/users/:id
		userRoutes.PUT("/:id", userHandler.UpdateUser)    // PUT /api/users/:id
		userRoutes.DELETE("/:id", userHandler.DeleteUser) // DELETE /api/users/:id
	}
}
