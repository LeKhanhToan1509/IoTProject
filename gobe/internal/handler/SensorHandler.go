package handler

import (
	"iot/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type SensorHandlerInterface interface {
	GetAllSensorData(c *gin.Context)
	GetSensorDataByID(c *gin.Context)
	GetLastSensorData(c *gin.Context)
}

type SensorHandler struct {
	s     services.SensorServiceInterface
	redis *redis.Client
	db    *gorm.DB
}

func NewSensorHandler(s services.SensorServiceInterface, redis *redis.Client, db *gorm.DB) SensorHandlerInterface {
	return &SensorHandler{
		s:     s,
		redis: redis,
		db:    db,
	}
}

func (h *SensorHandler) GetAllSensorData(c *gin.Context) {
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
	startDate := c.DefaultQuery("start_date", "")
	endDate := c.DefaultQuery("end_date", "")
	search := c.DefaultQuery("search", "")


	data, total, err := h.s.GetAllSensorData(h.db, limitInt, offsetInt, sort_by, order, startDate, endDate, search)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to retrieve sensor data"})
		return
	}
	c.JSON(200, gin.H{"data": data, "total": total})

}

func (h *SensorHandler) GetSensorDataByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil || id <= 0 {
		c.JSON(400, gin.H{"error": "Invalid ID parameter"})
		return
	}
	data, err := h.s.GetSensorDataByID(h.db, uint(id))
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to retrieve sensor data"})
		return
	}
	if data == nil {
		c.JSON(404, gin.H{"error": "Sensor data not found"})
		return
	}
	c.JSON(200, gin.H{"data": data})
}

func (h *SensorHandler) GetLastSensorData(c *gin.Context) {
	data, err := h.s.GetLastSensorData(h.db, h.redis, c)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to retrieve last sensor data"})
		return
	}
	c.JSON(200, gin.H{"data": data})
}
