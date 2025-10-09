package handler

import (
	"context"
	"fmt"
	"iot/internal/dto"
	"iot/internal/helper/mailer"
	"iot/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// Triển khai interface

type UserHandlerInterface interface {
	RegisterOTP(c *gin.Context)
	Register(c *gin.Context)
	Login(c *gin.Context)
	Logout(c *gin.Context)
	GetUserByID(c *gin.Context)
	GetAllUsers(c *gin.Context)
	UpdateUser(c *gin.Context)
	DeleteUser(c *gin.Context)
	RefreshToken(c *gin.Context)
}

type UserHandler struct {
	us     services.UserServiceInterface
	db     *gorm.DB
	mailer *mailer.MailService
	redis  *redis.Client
	ctx    context.Context
}

func NewUserHandler(db *gorm.DB, us services.UserServiceInterface, mailer *mailer.MailService, redis *redis.Client, ctx context.Context) UserHandlerInterface {
	return &UserHandler{
		us:     us,
		db:     db,
		mailer: mailer,
		redis:  redis,
		ctx:    ctx,
	}
}

func (h *UserHandler) RegisterOTP(c *gin.Context) {
	var req = dto.CreateUserRequest{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userData, err := h.us.RegisterOTP(h.db, &req, h.mailer, h.redis, h.ctx)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "User created successfully", "data": userData})
}

func (h *UserHandler) Register(c *gin.Context) {
	var req = dto.RegisterRequest{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userData, err := h.us.Register(h.db, &req, h.mailer, h.redis)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "User registered successfully", "data": userData})
}

func (h *UserHandler) Logout(c *gin.Context) {
	rfToken, err := c.Cookie("refresh_token")
	fmt.Println("Refresh token:", rfToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token not found"})
		return
	}
	c.SetCookie("refresh_token", "", -1, "/", "localhost", false, true)
	c.SetCookie("access_token", "", -1, "/", "localhost", false, true)

	c.JSON(200, gin.H{
		"message": "User logged out successfully",
	})

}
func (h *UserHandler) Login(c *gin.Context) {
	var req = dto.LoginRequest{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	reponse, err := h.us.Login(h.db, req.Email, req.Password)

	c.SetCookie("refresh_token", reponse.TokenPair.RefreshToken, 3600*24*7, "/", "localhost", false, true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.SetCookie("access_token", reponse.TokenPair.AccessToken, 3600, "/", "localhost", false, true)
	c.JSON(200, gin.H{
		"message": "User logged in successfully",
		"user":    reponse.User,
	})
}

func (h *UserHandler) RefreshToken(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token not found"})
		return
	}
	response, err := h.us.RefreshToken(h.db, refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	c.SetCookie("refresh_token", response.TokenPair.RefreshToken, 3600*24*7, "/", "localhost", false, true)
	c.SetCookie("access_token", response.TokenPair.AccessToken, 3600, "/", "localhost", false, true)
	c.JSON(200, gin.H{
		"message": "Token refreshed successfully",
	})
}
func (h *UserHandler) GetUserByID(c *gin.Context) {
	userId := c.Param("id")
	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}
	
	var id uint
	if _, err := fmt.Sscan(userId, &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid User ID"})
		return
	}
	user, err := h.us.GetUserByID(h.db, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "User fetched successfully", "data": user})

}

func (h *UserHandler) GetAllUsers(c *gin.Context) {
	limit := c.Query("limit")
	offset := c.Query("offset")

	limitInt, err := strconv.Atoi(limit)
	if err != nil {
		limitInt = 10
	}
	offsetInt, err := strconv.Atoi(offset)
	if err != nil {
		offsetInt = 0
	}
	users, err := h.us.GetAllUsers(h.db, limitInt, offsetInt, h.redis)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Users fetched successfully", "data": users})
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	var req = dto.UpdateUserRequest{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userId := c.Param("id")
	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}
	var id uint
	if _, err := fmt.Sscan(userId, &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid User ID"})
		return
	}
	err := h.us.UpdateUser(h.db, id, &req, h.redis)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "User updated successfully"})
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	userId := c.Param("id")
	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}
	var id uint
	if _, err := fmt.Sscan(userId, &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid User ID"})
		return
	}
	err := h.us.DeleteUser(h.db, id, h.redis)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "User deleted successfully"})
}
