package dto

import (
	"iot/internal/jwt_utils"
)

type UserDTO struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type CreateUserRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type CreateUserResponseWithOTP struct {
	Name  string `json:"name" binding:"required"`
	Email string `json:"email" binding:"required,email"`
	Time  string `json:"time" binding:"required"`
}

type RegisterRequest struct {
	Name  string `json:"name" binding:"required"`
	Email string `json:"email" binding:"required,email"`
	Time  string `json:"time" binding:"required"`
	OTP   string `json:"otp" binding:"required"`
}

type RegisterResponse struct {
	User      *UserDTO             `json:"user"`
	TokenPair *jwt_utils.TokenPair `json:"token_pair"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	User      *UserDTO             `json:"user"`
	TokenPair *jwt_utils.TokenPair `json:"token_pair"`
}

type CreateUserResponse struct {
	ID           uint   `json:"id"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type UpdateUserRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email" binding:"omitempty,email"`
	Password string `json:"password"`
}

type GetAllUsersRequest struct {
	Limit  int `form:"limit,default=10"`
	Offset int `form:"offset,default=0"`
}

type GetUserByIDRequest struct {
	ID uint `uri:"id" binding:"required"`
}

type DeleteUserRequest struct {
	ID uint `uri:"id" binding:"required"`
}

type GetAllUsersResponse struct {
	Users  []UserResponse `json:"users"`
	Total  int64          `json:"total"`
	Limit  int            `json:"limit"`
	Offset int            `json:"offset"`
}

type UserResponse struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}
