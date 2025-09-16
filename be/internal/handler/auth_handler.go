package handler

import (
	"errors"
	"iot/internal/jwt"
	"iot/logger"
	"iot/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService services.AuthServiceInterface
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func NewAuthHandler(authService services.AuthServiceInterface) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Helper function to log HTTP requests
func (h *AuthHandler) logRequest(c *gin.Context, statusCode int, duration time.Duration) {
	logger.LogHTTPRequest(c.Request.Method, c.Request.URL.Path, c.ClientIP(), statusCode, duration)
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	start := time.Now()

	var req services.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid input data: " + err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	response, err := h.authService.Register(req.Name, req.Email, req.Password)
	if err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "registration_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	h.logRequest(c, http.StatusCreated, time.Since(start))
	c.JSON(http.StatusCreated, SuccessResponse{
		Success: true,
		Message: response.Message,
		Data:    response,
	})
}

// VerifyEmail handles email verification
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	start := time.Now()

	var req struct {
		Email string `json:"email" binding:"required,email"`
		Code  string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid input data: " + err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	response, err := h.authService.VerifyEmail(req.Email, req.Code)
	if err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "verification_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	h.logRequest(c, http.StatusOK, time.Since(start))
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Message: response.Message,
		Data:    response,
	})
}

// ResendVerificationCode handles resending verification codes
func (h *AuthHandler) ResendVerificationCode(c *gin.Context) {
	start := time.Now()

	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid input data: " + err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	err := h.authService.ResendVerificationCode(req.Email)
	if err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "resend_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	h.logRequest(c, http.StatusOK, time.Since(start))
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Message: "Verification code sent successfully",
	})
}

// Login handles user authentication
func (h *AuthHandler) Login(c *gin.Context) {
	start := time.Now()

	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid input data: " + err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	response, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		h.logRequest(c, http.StatusUnauthorized, time.Since(start))
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "authentication_failed",
			Message: err.Error(),
			Code:    http.StatusUnauthorized,
		})
		return
	}

	h.logRequest(c, http.StatusOK, time.Since(start))
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Message: response.Message,
		Data:    response,
	})
}

// RefreshToken handles token refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	start := time.Now()

	var req services.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid input data: " + err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	response, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		h.logRequest(c, http.StatusUnauthorized, time.Since(start))
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "token_refresh_failed",
			Message: err.Error(),
			Code:    http.StatusUnauthorized,
		})
		return
	}

	h.logRequest(c, http.StatusOK, time.Since(start))
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Message: response.Message,
		Data:    response,
	})
}

// RequestPasswordReset handles password reset requests
func (h *AuthHandler) RequestPasswordReset(c *gin.Context) {
	start := time.Now()

	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid input data: " + err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	err := h.authService.RequestPasswordReset(req.Email)
	if err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "password_reset_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	h.logRequest(c, http.StatusOK, time.Since(start))
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Message: "Password reset instructions sent to your email",
	})
}

// ResetPassword handles password reset with token
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	start := time.Now()

	var req struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid input data: " + err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	response, err := h.authService.ResetPassword(req.Token, req.NewPassword)
	if err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "password_reset_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	h.logRequest(c, http.StatusOK, time.Since(start))
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Message: response.Message,
		Data:    response,
	})
}

// ChangePassword handles password changes for authenticated users
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	start := time.Now()

	userID, err := getUserIDFromContext(c)
	if err != nil {
		h.logRequest(c, http.StatusUnauthorized, time.Since(start))
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "unauthorized",
			Message: "Authentication required",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	var req services.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid input data: " + err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	err = h.authService.ChangePassword(userID, req.OldPassword, req.NewPassword)
	if err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "password_change_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	h.logRequest(c, http.StatusOK, time.Since(start))
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Message: "Password changed successfully",
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	start := time.Now()

	userID, err := getUserIDFromContext(c)
	if err != nil {
		h.logRequest(c, http.StatusUnauthorized, time.Since(start))
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "unauthorized",
			Message: "Authentication required",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	err = h.authService.Logout(userID)
	if err != nil {
		h.logRequest(c, http.StatusBadRequest, time.Since(start))
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "logout_failed",
			Message: err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	h.logRequest(c, http.StatusOK, time.Since(start))
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Message: "Logged out successfully",
	})
}

// ValidateToken validates JWT token
func (h *AuthHandler) ValidateToken(c *gin.Context) {
	start := time.Now()

	tokenString, err := jwt.ExtractTokenFromHeader(c.GetHeader("Authorization"))
	if err != nil || tokenString == "" {
		h.logRequest(c, http.StatusUnauthorized, time.Since(start))
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "unauthorized",
			Message: "Authorization header required",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	claims, err := h.authService.ValidateToken(tokenString)
	if err != nil {
		h.logRequest(c, http.StatusUnauthorized, time.Since(start))
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "unauthorized",
			Message: "Invalid or expired token",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	validationData := map[string]interface{}{
		"valid":   true,
		"user_id": claims.UserID,
		"email":   claims.Email,
		"exp":     claims.ExpiresAt,
		"iat":     claims.IssuedAt,
	}

	h.logRequest(c, http.StatusOK, time.Since(start))
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Message: "Token is valid",
		Data:    validationData,
	})
}

// GetProfile gets current user profile
func (h *AuthHandler) GetProfile(c *gin.Context) {
	start := time.Now()

	userID, err := getUserIDFromContext(c)
	if err != nil {
		h.logRequest(c, http.StatusUnauthorized, time.Since(start))
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "unauthorized",
			Message: "Authentication required",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	// Get user claims from context
	userClaims, exists := c.Get("user")
	if !exists {
		h.logRequest(c, http.StatusUnauthorized, time.Since(start))
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "unauthorized",
			Message: "User information not found",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	claims, ok := userClaims.(*jwt.Claims)
	if !ok {
		h.logRequest(c, http.StatusUnauthorized, time.Since(start))
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "unauthorized",
			Message: "Invalid token claims",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	profileData := map[string]interface{}{
		"id":    userID,
		"email": claims.Email,
	}

	h.logRequest(c, http.StatusOK, time.Since(start))
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Message: "Profile retrieved successfully",
		Data:    profileData,
	})
}

// Helper function to get user ID from context
func getUserIDFromContext(c *gin.Context) (uint, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, errors.New("user ID not found in context")
	}

	switch v := userID.(type) {
	case uint:
		return v, nil
	case int:
		return uint(v), nil
	case string:
		if id, err := strconv.ParseUint(v, 10, 32); err == nil {
			return uint(id), nil
		}
		return 0, errors.New("invalid user ID format")
	default:
		return 0, errors.New("invalid user ID type")
	}
}
