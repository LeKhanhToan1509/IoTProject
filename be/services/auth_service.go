package services

import (
	"errors"
	"iot/internal/jwt"
	"iot/internal/model"
	"iot/internal/repository"
	"iot/logger"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"go.uber.org/zap"
)

type AuthServiceInterface interface {
	Register(name, email, password string) (*AuthResponse, error)
	VerifyEmail(email, code string) (*AuthResponse, error)
	ResendVerificationCode(email string) error
	Login(email, password string) (*AuthResponse, error)
	RefreshToken(refreshToken string) (*AuthResponse, error)
	ValidateToken(token string) (*jwt.Claims, error)
	RequestPasswordReset(email string) error
	ResetPassword(token, newPassword string) (*AuthResponse, error)
	Logout(userID uint) error
	ChangePassword(userID uint, oldPassword, newPassword string) error
}

type AuthService struct {
	userRepo              repository.UserRepositoryInterface
	emailVerificationRepo repository.EmailVerificationRepositoryInterface
	passwordResetRepo     repository.PasswordResetRepositoryInterface
	emailService          EmailServiceInterface
}

type AuthResponse struct {
	User    *UserInfo      `json:"user"`
	Tokens  *jwt.TokenPair `json:"tokens"`
	Message string         `json:"message"`
}

type UserInfo struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6,max=100"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6,max=100"`
}

func NewAuthService(
	userRepo repository.UserRepositoryInterface,
	emailVerificationRepo repository.EmailVerificationRepositoryInterface,
	passwordResetRepo repository.PasswordResetRepositoryInterface,
	emailService EmailServiceInterface,
) AuthServiceInterface {
	return &AuthService{
		userRepo:              userRepo,
		emailVerificationRepo: emailVerificationRepo,
		passwordResetRepo:     passwordResetRepo,
		emailService:          emailService,
	}
}

// Register creates a new user account
func (s *AuthService) Register(name, email, password string) (*AuthResponse, error) {
	start := time.Now()

	// Validate input
	if err := s.validateRegisterInput(name, email, password); err != nil {
		logger.LogServiceOperation("AuthService", "Register", time.Since(start), err)
		return nil, err
	}

	// Check if user already exists
	existingUser, _ := s.userRepo.GetByEmail(email)
	if existingUser != nil {
		err := errors.New("user with this email already exists")
		logger.LogServiceOperation("AuthService", "Register", time.Since(start), err)
		return nil, err
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash password", zap.Error(err))
		return nil, errors.New("failed to process password")
	}

	// Create user
	user := &model.User{
		Name:     strings.TrimSpace(name),
		Email:    strings.ToLower(strings.TrimSpace(email)),
		Password: string(hashedPassword),
	}

	if err := s.userRepo.Create(user); err != nil {
		logger.LogServiceOperation("AuthService", "Register", time.Since(start), err)
		return nil, errors.New("failed to create user account")
	}

	// Generate verification code
	code, err := s.emailService.GenerateVerificationCode()
	if err != nil {
		logger.Error("Failed to generate verification code", zap.Error(err))
		return nil, errors.New("failed to generate verification code")
	}

	// Save verification code
	verification := &model.EmailVerification{
		UserID: user.ID,
		Email:  user.Email,
		Code:   code,
	}

	if err := s.emailVerificationRepo.Create(verification); err != nil {
		logger.Error("Failed to save verification code", zap.Error(err))
		return nil, errors.New("failed to save verification code")
	}

	// Send verification email
	go func() {
		if err := s.emailService.SendVerificationEmail(user.Email, user.Name, code); err != nil {
			logger.Error("Failed to send verification email", zap.Error(err))
		}
	}()

	// Log successful registration
	logger.LogBusinessEvent("user_registered", map[string]interface{}{
		"user_id": user.ID,
		"email":   user.Email,
		"name":    user.Name,
	})

	logger.LogServiceOperation("AuthService", "Register", time.Since(start), nil)

	return &AuthResponse{
		User: &UserInfo{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		},
		Tokens:  nil, // No tokens until email is verified
		Message: "User registered successfully. Please check your email for verification code.",
	}, nil
}

// Login authenticates a user and returns tokens
func (s *AuthService) Login(email, password string) (*AuthResponse, error) {
	start := time.Now()

	// Validate input
	if err := s.validateLoginInput(email, password); err != nil {
		logger.LogServiceOperation("AuthService", "Login", time.Since(start), err)
		return nil, err
	}

	// Find user by email
	user, err := s.userRepo.GetByEmail(strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		logger.LogSecurityEvent("Failed login attempt - user not found", "", "", "low")
		return nil, errors.New("invalid email or password")
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		logger.LogSecurityEvent("Failed login attempt - wrong password", "", "", "medium")
		return nil, errors.New("invalid email or password")
	}

	// Generate tokens
	tokens, err := jwt.GenerateTokenPair(user.ID, user.Email)
	if err != nil {
		logger.Error("Failed to generate tokens", zap.Error(err))
		return nil, errors.New("failed to generate authentication tokens")
	}

	// Log successful login
	logger.LogBusinessEvent("user_login", map[string]interface{}{
		"user_id": user.ID,
		"email":   user.Email,
	})

	logger.LogServiceOperation("AuthService", "Login", time.Since(start), nil)

	return &AuthResponse{
		User: &UserInfo{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		},
		Tokens:  tokens,
		Message: "Login successful",
	}, nil
}

// RefreshToken generates new tokens using refresh token
func (s *AuthService) RefreshToken(refreshToken string) (*AuthResponse, error) {
	start := time.Now()

	if strings.TrimSpace(refreshToken) == "" {
		err := errors.New("refresh token is required")
		logger.LogServiceOperation("AuthService", "RefreshToken", time.Since(start), err)
		return nil, err
	}

	// Generate new token pair
	tokens, err := jwt.RefreshAccessToken(refreshToken)
	if err != nil {
		logger.LogServiceOperation("AuthService", "RefreshToken", time.Since(start), err)
		return nil, errors.New("invalid or expired refresh token")
	}

	// Get user info from token
	claims, err := jwt.ValidateToken(tokens.AccessToken)
	if err != nil {
		logger.Error("Failed to validate newly generated token", zap.Error(err))
		return nil, errors.New("failed to validate token")
	}

	user, err := s.userRepo.GetByID(claims.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	logger.LogServiceOperation("AuthService", "RefreshToken", time.Since(start), nil)

	return &AuthResponse{
		User: &UserInfo{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		},
		Tokens:  tokens,
		Message: "Token refreshed successfully",
	}, nil
}

// ValidateToken validates a JWT token and returns claims
func (s *AuthService) ValidateToken(token string) (*jwt.Claims, error) {
	return jwt.ValidateToken(token)
}

// Logout invalidates user tokens (placeholder - in production you'd use a blacklist)
func (s *AuthService) Logout(userID uint) error {
	// In a production system, you would:
	// 1. Add tokens to a blacklist/redis
	// 2. Or store token JTI in database for invalidation
	// For now, we just log the logout event

	logger.LogBusinessEvent("user_logout", map[string]interface{}{
		"user_id": userID,
	})

	return nil
}

// ChangePassword changes user's password
func (s *AuthService) ChangePassword(userID uint, oldPassword, newPassword string) error {
	start := time.Now()

	// Get user
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		logger.LogServiceOperation("AuthService", "ChangePassword", time.Since(start), err)
		return errors.New("user not found")
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword)); err != nil {
		err := errors.New("current password is incorrect")
		logger.LogServiceOperation("AuthService", "ChangePassword", time.Since(start), err)
		return err
	}

	// Validate new password
	if len(newPassword) < 6 {
		err := errors.New("new password must be at least 6 characters long")
		logger.LogServiceOperation("AuthService", "ChangePassword", time.Since(start), err)
		return err
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash new password", zap.Error(err))
		return errors.New("failed to process new password")
	}

	// Update password
	user.Password = string(hashedPassword)
	if err := s.userRepo.Update(user); err != nil {
		logger.LogServiceOperation("AuthService", "ChangePassword", time.Since(start), err)
		return errors.New("failed to update password")
	}

	// Log password change
	logger.LogBusinessEvent("password_changed", map[string]interface{}{
		"user_id": userID,
		"email":   user.Email,
	})

	logger.LogServiceOperation("AuthService", "ChangePassword", time.Since(start), nil)

	return nil
}

// VerifyEmail verifies user's email with verification code
func (s *AuthService) VerifyEmail(email, code string) (*AuthResponse, error) {
	start := time.Now()

	if strings.TrimSpace(email) == "" || strings.TrimSpace(code) == "" {
		err := errors.New("email and verification code are required")
		logger.LogServiceOperation("AuthService", "VerifyEmail", time.Since(start), err)
		return nil, err
	}

	// Get verification record
	verification, err := s.emailVerificationRepo.GetByCode(code)
	if err != nil {
		logger.LogServiceOperation("AuthService", "VerifyEmail", time.Since(start), err)
		return nil, errors.New("invalid or expired verification code")
	}

	// Check if email matches
	if verification.Email != strings.ToLower(strings.TrimSpace(email)) {
		err := errors.New("verification code does not match email")
		logger.LogServiceOperation("AuthService", "VerifyEmail", time.Since(start), err)
		return nil, err
	}

	// Mark verification as used
	if err := s.emailVerificationRepo.MarkAsUsed(verification.ID); err != nil {
		logger.Error("Failed to mark verification as used", zap.Error(err))
		return nil, errors.New("failed to verify email")
	}

	// Get user and generate tokens
	user, err := s.userRepo.GetByID(verification.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	tokens, err := jwt.GenerateTokenPair(user.ID, user.Email)
	if err != nil {
		logger.Error("Failed to generate tokens", zap.Error(err))
		return nil, errors.New("failed to generate authentication tokens")
	}

	// Send welcome email
	go func() {
		if err := s.emailService.SendWelcomeEmail(user.Email, user.Name); err != nil {
			logger.Error("Failed to send welcome email", zap.Error(err))
		}
	}()

	logger.LogBusinessEvent("email_verified", map[string]interface{}{
		"user_id": user.ID,
		"email":   user.Email,
	})

	logger.LogServiceOperation("AuthService", "VerifyEmail", time.Since(start), nil)

	return &AuthResponse{
		User: &UserInfo{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		},
		Tokens:  tokens,
		Message: "Email verified successfully",
	}, nil
}

// ResendVerificationCode sends a new verification code
func (s *AuthService) ResendVerificationCode(email string) error {
	start := time.Now()

	if strings.TrimSpace(email) == "" {
		err := errors.New("email is required")
		logger.LogServiceOperation("AuthService", "ResendVerificationCode", time.Since(start), err)
		return err
	}

	// Get user
	user, err := s.userRepo.GetByEmail(strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		logger.LogServiceOperation("AuthService", "ResendVerificationCode", time.Since(start), err)
		return errors.New("user not found")
	}

	// Generate new verification code
	code, err := s.emailService.GenerateVerificationCode()
	if err != nil {
		logger.Error("Failed to generate verification code", zap.Error(err))
		return errors.New("failed to generate verification code")
	}

	// Save verification code
	verification := &model.EmailVerification{
		UserID: user.ID,
		Email:  user.Email,
		Code:   code,
	}

	if err := s.emailVerificationRepo.Create(verification); err != nil {
		logger.Error("Failed to save verification code", zap.Error(err))
		return errors.New("failed to save verification code")
	}

	// Send verification email
	if err := s.emailService.SendVerificationEmail(user.Email, user.Name, code); err != nil {
		logger.Error("Failed to send verification email", zap.Error(err))
		return errors.New("failed to send verification email")
	}

	logger.LogServiceOperation("AuthService", "ResendVerificationCode", time.Since(start), nil)
	return nil
}

// RequestPasswordReset initiates password reset process
func (s *AuthService) RequestPasswordReset(email string) error {
	start := time.Now()

	if strings.TrimSpace(email) == "" {
		err := errors.New("email is required")
		logger.LogServiceOperation("AuthService", "RequestPasswordReset", time.Since(start), err)
		return err
	}

	// Get user
	user, err := s.userRepo.GetByEmail(strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		// Don't reveal if user exists for security
		logger.LogServiceOperation("AuthService", "RequestPasswordReset", time.Since(start), nil)
		return nil
	}

	// Generate reset token
	token, err := s.emailService.GenerateResetToken()
	if err != nil {
		logger.Error("Failed to generate reset token", zap.Error(err))
		return errors.New("failed to generate reset token")
	}

	// Delete any existing reset tokens for this user
	s.passwordResetRepo.DeleteByUserID(user.ID)

	// Save reset token
	reset := &model.PasswordReset{
		UserID: user.ID,
		Email:  user.Email,
		Token:  token,
	}

	if err := s.passwordResetRepo.Create(reset); err != nil {
		logger.Error("Failed to save reset token", zap.Error(err))
		return errors.New("failed to save reset token")
	}

	// Send password reset email
	if err := s.emailService.SendPasswordResetEmail(user.Email, user.Name, token); err != nil {
		logger.Error("Failed to send password reset email", zap.Error(err))
		return errors.New("failed to send password reset email")
	}

	logger.LogBusinessEvent("password_reset_requested", map[string]interface{}{
		"user_id": user.ID,
		"email":   user.Email,
	})

	logger.LogServiceOperation("AuthService", "RequestPasswordReset", time.Since(start), nil)
	return nil
}

// ResetPassword resets password using reset token
func (s *AuthService) ResetPassword(token, newPassword string) (*AuthResponse, error) {
	start := time.Now()

	if strings.TrimSpace(token) == "" || strings.TrimSpace(newPassword) == "" {
		err := errors.New("token and new password are required")
		logger.LogServiceOperation("AuthService", "ResetPassword", time.Since(start), err)
		return nil, err
	}

	if len(newPassword) < 6 {
		err := errors.New("password must be at least 6 characters long")
		logger.LogServiceOperation("AuthService", "ResetPassword", time.Since(start), err)
		return nil, err
	}

	// Get reset record
	reset, err := s.passwordResetRepo.GetByToken(token)
	if err != nil {
		logger.LogServiceOperation("AuthService", "ResetPassword", time.Since(start), err)
		return nil, errors.New("invalid or expired reset token")
	}

	// Get user
	user, err := s.userRepo.GetByID(reset.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash new password", zap.Error(err))
		return nil, errors.New("failed to process password")
	}

	// Update password
	user.Password = string(hashedPassword)
	if err := s.userRepo.Update(user); err != nil {
		logger.LogServiceOperation("AuthService", "ResetPassword", time.Since(start), err)
		return nil, errors.New("failed to update password")
	}

	// Mark reset token as used
	if err := s.passwordResetRepo.MarkAsUsed(reset.ID); err != nil {
		logger.Error("Failed to mark reset token as used", zap.Error(err))
	}

	// Generate new tokens
	tokens, err := jwt.GenerateTokenPair(user.ID, user.Email)
	if err != nil {
		logger.Error("Failed to generate tokens", zap.Error(err))
		return nil, errors.New("failed to generate authentication tokens")
	}

	// Send password changed notification
	go func() {
		if err := s.emailService.SendPasswordChangedNotification(user.Email, user.Name); err != nil {
			logger.Error("Failed to send password changed notification", zap.Error(err))
		}
	}()

	logger.LogBusinessEvent("password_reset_completed", map[string]interface{}{
		"user_id": user.ID,
		"email":   user.Email,
	})

	logger.LogServiceOperation("AuthService", "ResetPassword", time.Since(start), nil)

	return &AuthResponse{
		User: &UserInfo{
			ID:        user.ID,
			Name:      user.Name,
			Email:     user.Email,
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		},
		Tokens:  tokens,
		Message: "Password reset successfully",
	}, nil
}

// Helper functions for validation
func (s *AuthService) validateRegisterInput(name, email, password string) error {
	if strings.TrimSpace(name) == "" {
		return errors.New("name is required")
	}
	if len(strings.TrimSpace(name)) < 2 {
		return errors.New("name must be at least 2 characters long")
	}
	if strings.TrimSpace(email) == "" {
		return errors.New("email is required")
	}
	if !isValidEmail(email) {
		return errors.New("invalid email format")
	}
	if strings.TrimSpace(password) == "" {
		return errors.New("password is required")
	}
	if len(password) < 6 {
		return errors.New("password must be at least 6 characters long")
	}
	return nil
}

func (s *AuthService) validateLoginInput(email, password string) error {
	if strings.TrimSpace(email) == "" {
		return errors.New("email is required")
	}
	if strings.TrimSpace(password) == "" {
		return errors.New("password is required")
	}
	return nil
}

// isValidEmail checks if email format is valid (basic check)
func isValidEmail(email string) bool {
	email = strings.TrimSpace(email)
	return strings.Contains(email, "@") && strings.Contains(email, ".") && len(email) > 5
}
