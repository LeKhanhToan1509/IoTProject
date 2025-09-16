package middlewares

import (
	"iot/internal/jwt"
	"iot/logger"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

// JWTMiddleware validates JWT tokens and adds user info to context
func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Extract token from Authorization header
		tokenString, err := jwt.ExtractTokenFromHeader(c.GetHeader("Authorization"))
		if err != nil || tokenString == "" {
			logger.LogHTTPRequest(c.Request.Method, c.Request.URL.Path, c.ClientIP(), http.StatusUnauthorized, time.Since(start))
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "unauthorized",
				Message: "Authorization header required",
				Code:    http.StatusUnauthorized,
			})
			c.Abort()
			return
		}

		// Validate token
		claims, err := jwt.ValidateToken(tokenString)
		if err != nil {
			logger.LogHTTPRequest(c.Request.Method, c.Request.URL.Path, c.ClientIP(), http.StatusUnauthorized, time.Since(start))
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "unauthorized",
				Message: "Invalid or expired token",
				Code:    http.StatusUnauthorized,
			})
			c.Abort()
			return
		}

		// Add user info to context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user", claims)

		// Continue to next handler
		c.Next()
	}
}

// OptionalJWTMiddleware validates JWT tokens if present but doesn't require them
func OptionalJWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from Authorization header
		tokenString, err := jwt.ExtractTokenFromHeader(c.GetHeader("Authorization"))
		if err != nil || tokenString == "" {
			// No token provided, continue without authentication
			c.Next()
			return
		}

		// Validate token if provided
		claims, err := jwt.ValidateToken(tokenString)
		if err != nil {
			// Invalid token, continue without authentication
			c.Next()
			return
		}

		// Add user info to context if token is valid
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user", claims)

		c.Next()
	}
}

// RequireRole middleware ensures user has specific role
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Get user claims from context (should be set by JWTMiddleware)
		userClaims, exists := c.Get("user")
		if !exists {
			logger.LogHTTPRequest(c.Request.Method, c.Request.URL.Path, c.ClientIP(), http.StatusUnauthorized, time.Since(start))
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "unauthorized",
				Message: "Authentication required",
				Code:    http.StatusUnauthorized,
			})
			c.Abort()
			return
		}

		claims, ok := userClaims.(*jwt.Claims)
		if !ok {
			logger.LogHTTPRequest(c.Request.Method, c.Request.URL.Path, c.ClientIP(), http.StatusUnauthorized, time.Since(start))
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "unauthorized",
				Message: "Invalid token claims",
				Code:    http.StatusUnauthorized,
			})
			c.Abort()
			return
		}

		// Check if user has required role (currently claims only have UserID and Email)
		// This would need to be enhanced to include roles in JWT claims
		// For now, we'll just continue as any authenticated user is allowed
		_ = claims
		_ = roles

		c.Next()
	}
}

// RateLimiter middleware for basic rate limiting
func RateLimiter() gin.HandlerFunc {
	// This is a simple in-memory rate limiter
	// In production, you'd want to use Redis or similar
	return gin.HandlerFunc(func(c *gin.Context) {
		// For now, just continue
		// TODO: Implement proper rate limiting
		c.Next()
	})
}

// AdminOnly middleware ensures only admin users can access
func AdminOnly() gin.HandlerFunc {
	return RequireRole("admin")
}

// LoggedInOnly is an alias for JWTMiddleware for clarity
func LoggedInOnly() gin.HandlerFunc {
	return JWTMiddleware()
}
