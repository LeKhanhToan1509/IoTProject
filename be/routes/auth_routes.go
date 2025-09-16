package routes

import (
	"iot/internal/handler"
	"iot/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupAuthRoutes(router *gin.Engine, authHandler *handler.AuthHandler) {
	// Auth routes group
	auth := router.Group("/api/v1/auth")
	{
		// Public routes (no authentication required)
		auth.POST("/register", authHandler.Register)
		auth.POST("/verify-email", authHandler.VerifyEmail)
		auth.POST("/resend-verification", authHandler.ResendVerificationCode)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.RefreshToken)
		auth.POST("/forgot-password", authHandler.RequestPasswordReset)
		auth.POST("/reset-password", authHandler.ResetPassword)

		// Token validation (no authentication required but validates if provided)
		auth.GET("/validate", authHandler.ValidateToken)

		// Protected routes (authentication required)
		protected := auth.Group("")
		protected.Use(middlewares.JWTMiddleware())
		{
			protected.POST("/logout", authHandler.Logout)
			protected.POST("/change-password", authHandler.ChangePassword)
			protected.GET("/profile", authHandler.GetProfile)
		}
	}
}
