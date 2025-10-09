package handler

import (
	"iot/internal/dto"
	"iot/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DeviceHistoryHandlerInterface interface {
	CreateDeviceHistory(c *gin.Context)
	GetDeviceHistoryByDeviceID(c *gin.Context)
	GetAllDeviceHistories(c *gin.Context)
}

type DeviceHistoryHandler struct {
	db                   *gorm.DB
	deviceHistoryService services.DeviceHistoryServiceInterface
}

func NewDeviceHistoryHandler(db *gorm.DB, dhs services.DeviceHistoryServiceInterface) DeviceHistoryHandlerInterface {
	return &DeviceHistoryHandler{
		db:                   db,
		deviceHistoryService: dhs,
	}
}

func (h *DeviceHistoryHandler) CreateDeviceHistory(c *gin.Context) {
	var req = &dto.CreateDeviceHistoryRequest{}
	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	history, err := h.deviceHistoryService.CreateDeviceHistory(h.db, *req)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, gin.H{"status": "success", "data": history})
}

func (h *DeviceHistoryHandler) GetDeviceHistoryByDeviceID(c *gin.Context) {
	deviceIDParam := c.Param("deviceID")
	deviceID, err := strconv.Atoi(deviceIDParam)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid device ID"})
		return
	}
	history, err := h.deviceHistoryService.GetDeviceHistoryByDeviceID(h.db, uint(deviceID))
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "success", "data": history})
}

func (h *DeviceHistoryHandler) GetAllDeviceHistories(c *gin.Context) {
	// This function can be implemented to fetch all device histories if needed
	limit := c.DefaultQuery("limit", "10")
	offset := c.DefaultQuery("offset", "0")
	order := c.DefaultQuery("order", "desc")
	sort_by := c.DefaultQuery("sort_by", "created_at")
	limitInt, err := strconv.Atoi(limit)
	if err != nil || limitInt <= 0 || limitInt > 100 {
		limitInt = 10
	}
	offsetInt, err := strconv.Atoi(offset)
	if err != nil || offsetInt < 0 {
		offsetInt = 0
	}
	status := c.DefaultQuery("status", "")
	deviceId := c.DefaultQuery("device_id", "")
	startDate := c.DefaultQuery("start_date", "")
	endDate := c.DefaultQuery("end_date", "")
	search := c.DefaultQuery("search", "")

	histories, total, err := h.deviceHistoryService.GetAllDeviceHistories(h.db, limitInt, offsetInt, sort_by+" "+order, status, deviceId, startDate, endDate, search)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "success", "data": histories, "total": total})
}
