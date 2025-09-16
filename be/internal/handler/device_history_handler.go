package handler

import (
	"net/http"
	"strconv"

	"iot/services"

	"github.com/gin-gonic/gin"
)

// Request structs
type CreateDeviceHistoryRequest struct {
	UserID     uint   `json:"user_id" binding:"required"`
	DeviceID   string `json:"device_id" binding:"required"`
	UserChange string `json:"user_change" binding:"required"`
	Status     string `json:"status" binding:"required,oneof=ON OFF"`
}

type UpdateDeviceHistoryRequest struct {
	UserID     uint   `json:"user_id" binding:"required"`
	DeviceID   string `json:"device_id" binding:"required"`
	UserChange string `json:"user_change" binding:"required"`
	Status     string `json:"status" binding:"required,oneof=ON OFF"`
}

// Response structs
type DeviceHistoryResponse struct {
	ID         uint   `json:"id"`
	UserID     uint   `json:"user_id"`
	DeviceID   string `json:"device_id"`
	UserChange string `json:"user_change"`
	Status     string `json:"status"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

type DeviceHistoryPaginationResponse struct {
	Data       []DeviceHistoryResponse `json:"data"`
	Page       int                     `json:"page"`
	Limit      int                     `json:"limit"`
	TotalCount int                     `json:"total_count"`
}

type DeviceHistoryHandler struct {
	deviceHistoryService services.DeviceHistoryServiceInterface
}

func NewDeviceHistoryHandler(deviceHistoryService services.DeviceHistoryServiceInterface) *DeviceHistoryHandler {
	return &DeviceHistoryHandler{deviceHistoryService: deviceHistoryService}
}

// CreateDeviceHistory creates a new device history record
func (h *DeviceHistoryHandler) CreateDeviceHistory(c *gin.Context) {
	var req CreateDeviceHistoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.deviceHistoryService.CreateDeviceHistory(req.UserID, req.DeviceID, req.UserChange, req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Device history created successfully"})
}

func (h *DeviceHistoryHandler) GetAllDeviceHistories(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	orderBy := c.DefaultQuery("order_by", "created_at DESC")

	// Calculate offset
	offset := (page - 1) * limit

	histories, err := h.deviceHistoryService.GetAllDeviceHistories(limit, offset, orderBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to response format - Initialize as empty slice to avoid null
	responseData := make([]DeviceHistoryResponse, 0)
	for _, history := range histories {
		responseData = append(responseData, DeviceHistoryResponse{
			ID:         history.ID,
			UserID:     history.UserID,
			DeviceID:   history.DeviceID,
			UserChange: history.UserChange,
			Status:     history.Status,
			CreatedAt:  history.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt:  history.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	response := DeviceHistoryPaginationResponse{
		Data:       responseData,
		Page:       page,
		Limit:      limit,
		TotalCount: len(responseData),
	}

	c.JSON(http.StatusOK, response)
}

func (h *DeviceHistoryHandler) GetDeviceHistoryByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	history, err := h.deviceHistoryService.GetDeviceHistoryByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device history not found"})
		return
	}

	response := DeviceHistoryResponse{
		ID:         history.ID,
		UserID:     history.UserID,
		DeviceID:   history.DeviceID,
		UserChange: history.UserChange,
		Status:     history.Status,
		CreatedAt:  history.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:  history.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	c.JSON(http.StatusOK, response)
}

func (h *DeviceHistoryHandler) GetDeviceHistoryByDeviceID(c *gin.Context) {
	deviceID := c.Param("deviceId")
	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Device ID is required"})
		return
	}

	history, err := h.deviceHistoryService.GetDeviceHistoryByDeviceID(deviceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device history not found"})
		return
	}

	response := DeviceHistoryResponse{
		ID:         history.ID,
		UserID:     history.UserID,
		DeviceID:   history.DeviceID,
		UserChange: history.UserChange,
		Status:     history.Status,
		CreatedAt:  history.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:  history.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	c.JSON(http.StatusOK, response)
}

func (h *DeviceHistoryHandler) UpdateDeviceHistory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var req UpdateDeviceHistoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing history
	existingHistory, err := h.deviceHistoryService.GetDeviceHistoryByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device history not found"})
		return
	}

	existingHistory.UserID = req.UserID
	existingHistory.DeviceID = req.DeviceID
	existingHistory.UserChange = req.UserChange
	existingHistory.Status = req.Status

	err = h.deviceHistoryService.UpdateDeviceHistory(existingHistory)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device history updated successfully"})
}

func (h *DeviceHistoryHandler) DeleteDeviceHistory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	err = h.deviceHistoryService.DeleteDeviceHistory(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device history deleted successfully"})
}
