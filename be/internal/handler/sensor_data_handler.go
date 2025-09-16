package handler

import (
	"net/http"
	"strconv"

	"iot/services"

	"github.com/gin-gonic/gin"
)

// Request structs
type CreateSensorDataRequest struct {
	Temperature float64 `json:"temperature" binding:"required"`
	Humidity    float64 `json:"humidity" binding:"required"`
	Light       int     `json:"light" binding:"required"`
}

type UpdateSensorDataRequest struct {
	Temperature float64 `json:"temperature" binding:"required"`
	Humidity    float64 `json:"humidity" binding:"required"`
	Light       int     `json:"light" binding:"required"`
}

// Response structs
type SensorDataResponse struct {
	ID          uint    `json:"id"`
	Temperature float64 `json:"temperature"`
	Humidity    float64 `json:"humidity"`
	Light       int     `json:"light"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

type PaginationResponse struct {
	Data       []SensorDataResponse `json:"data"`
	TotalCount int64                `json:"total_count"`
	Page       int                  `json:"page"`
	Limit      int                  `json:"limit"`
}

type SensorDataHandler struct {
	sensorService services.SensorServiceInterface
}

func NewSensorDataHandler(sensorService services.SensorServiceInterface) *SensorDataHandler {
	return &SensorDataHandler{sensorService: sensorService}
}

// CreateSensorData creates a new sensor data record
func (h *SensorDataHandler) CreateSensorData(c *gin.Context) {
	var req CreateSensorDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := h.sensorService.CreateSensorData(req.Temperature, req.Humidity, req.Light)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Sensor data created successfully"})
}

func (h *SensorDataHandler) GetAllSensorData(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	data, err := h.sensorService.GetAllSensorData(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get total count
	totalCount, err := h.sensorService.GetSensorDataCount()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to response format
	var responseData []SensorDataResponse
	for _, item := range data {
		responseData = append(responseData, SensorDataResponse{
			ID:          item.ID,
			Temperature: item.Temperature,
			Humidity:    item.Humidity,
			Light:       item.Light,
			CreatedAt:   item.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt:   item.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	response := PaginationResponse{
		Data:       responseData,
		TotalCount: totalCount,
		Page:       page,
		Limit:      limit,
	}

	c.JSON(http.StatusOK, response)
}

// GetLatestSensorData retrieves the latest sensor data
func (h *SensorDataHandler) GetLatestSensorData(c *gin.Context) {
	data, err := h.sensorService.GetLatestSensorData()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No sensor data found"})
		return
	}

	response := SensorDataResponse{
		ID:          data.ID,
		Temperature: data.Temperature,
		Humidity:    data.Humidity,
		Light:       data.Light,
		CreatedAt:   data.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:   data.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	c.JSON(http.StatusOK, response)
}

// GetSensorDataByID retrieves sensor data by ID
func (h *SensorDataHandler) GetSensorDataByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	data, err := h.sensorService.GetSensorDataByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sensor data not found"})
		return
	}

	response := SensorDataResponse{
		ID:          data.ID,
		Temperature: data.Temperature,
		Humidity:    data.Humidity,
		Light:       data.Light,
		CreatedAt:   data.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:   data.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	c.JSON(http.StatusOK, response)
}

// UpdateSensorData updates sensor data by ID
func (h *SensorDataHandler) UpdateSensorData(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var req UpdateSensorDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing data
	existingData, err := h.sensorService.GetSensorDataByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sensor data not found"})
		return
	}

	// Update fields
	existingData.Temperature = req.Temperature
	existingData.Humidity = req.Humidity
	existingData.Light = req.Light

	err = h.sensorService.UpdateSensorData(existingData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sensor data updated successfully"})
}

// DeleteSensorData deletes sensor data by ID
func (h *SensorDataHandler) DeleteSensorData(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	err = h.sensorService.DeleteSensorData(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sensor data deleted successfully"})
}
