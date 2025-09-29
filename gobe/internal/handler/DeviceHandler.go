package handler

import (
	"iot/internal/dto"
	"iot/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type DeviceHandlerInterface interface {
	CreateDevice(c *gin.Context)
	GetDeviceByID(c *gin.Context)
	GetAllDevices(c *gin.Context)
	UpdateDevice(c *gin.Context)
	DeleteDevice(c *gin.Context)
}

type DeviceHandler struct {
	db            *gorm.DB
	redis         *redis.Client
	deviceService services.DeviceServiceInterface
}

func NewDeviceHandler(db *gorm.DB, redis *redis.Client, ds services.DeviceServiceInterface) DeviceHandlerInterface {
	return &DeviceHandler{
		db:            db,
		redis:         redis,
		deviceService: ds,
	}
}

func (h *DeviceHandler) CreateDevice(c *gin.Context) {
	var req = dto.CreateDeviceRequest{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.deviceService.CreateDevice(h.db, &req, h.redis)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Device created successfully"})
}

func (h *DeviceHandler) GetDeviceByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}
	device, err := h.deviceService.GetByID(h.db, uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if device == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}
	c.JSON(200, gin.H{"data": device})
}

func (h *DeviceHandler) GetAllDevices(c *gin.Context) {
	limitParam := c.DefaultQuery("limit", "10")
	offsetParam := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitParam)
	if err != nil || limit <= 0 || limit > 100 {
		limit = 10
	}
	offset, err := strconv.Atoi(offsetParam)
	if err != nil || offset < 0 {
		offset = 0
	}

	devices, err := h.deviceService.GetAllDevices(h.db, limit, offset, h.redis)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"data": devices})
}

func (h *DeviceHandler) UpdateDevice(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}
	var req = dto.UpdateDeviceRequest{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err = h.deviceService.UpdateDevice(h.db, uint(id), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Device updated successfully"})
}

func (h *DeviceHandler) DeleteDevice(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}
	err = h.deviceService.DeleteDevice(h.db, uint(id), h.redis)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Device deleted successfully"})
}
