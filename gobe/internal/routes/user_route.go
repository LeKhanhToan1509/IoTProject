package routes

import (
	"iot/internal/handler"

	"github.com/gin-gonic/gin"
)

type UserRoute struct {
	UserHandler handler.UserHandlerInterface
}

func (r *UserRoute) Setup(api *gin.RouterGroup) {
	user := api.Group("/user")
	{
		user.POST("/register/otp", r.UserHandler.RegisterOTP)
		user.POST("/register", r.UserHandler.Register)
		user.POST("/login", r.UserHandler.Login)
		user.GET("/:id", r.UserHandler.GetUserByID)
		user.GET("/all", r.UserHandler.GetAllUsers)
		user.PUT("/:id", r.UserHandler.UpdateUser)
		user.DELETE("/:id", r.UserHandler.DeleteUser)
	}
}
