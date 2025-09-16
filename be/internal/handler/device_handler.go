package handler

import (
	"net/http"
	"strconv"

	"iot/services"

	"github.com/gin-gonic/gin"
)

// Request structs
type CreateDeviceRequest struct {
	Name   string `json:"name" binding:"required"`
	Status string `json:"status" binding:"required,oneof=ON OFF"`
}

type UpdateDeviceStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=ON OFF"`
}

// Response structs
type DeviceResponse struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type DeviceHandler struct {
	deviceService services.DeviceServiceInterface
}

func NewDeviceHandler(deviceService services.DeviceServiceInterface) *DeviceHandler {
	return &DeviceHandler{deviceService: deviceService}
}

// CreateDevice creates a new device
func (h *DeviceHandler) CreateDevice(c *gin.Context) {
	var req CreateDeviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.deviceService.CreateDevice(req.Name, req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Device created successfully"})
}

// GetAllDevices retrieves all devices
func (h *DeviceHandler) GetAllDevices(c *gin.Context) {
	devices, err := h.deviceService.GetAllDevices()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to response format
	var responseData []DeviceResponse
	for _, device := range devices {
		responseData = append(responseData, DeviceResponse{
			ID:        device.ID,
			Name:      device.Name,
			Status:    device.Status,
			CreatedAt: device.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt: device.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": responseData})
}

func (h *DeviceHandler) GetDeviceByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}
	
	device, err := h.deviceService.GetDeviceByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	response := DeviceResponse{
		ID:        device.ID,
		Name:      device.Name,
		Status:    device.Status,
		CreatedAt: device.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: device.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	c.JSON(http.StatusOK, response)
}

// GetDeviceByDeviceID retrieves device by device ID (string)
func (h *DeviceHandler) GetDeviceByDeviceID(c *gin.Context) {
	deviceID := c.Param("deviceId")
	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Device ID is required"})
		return
	}

	device, err := h.deviceService.GetDeviceByDeviceID(deviceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	response := DeviceResponse{
		ID:        device.ID,
		Name:      device.Name,
		Status:    device.Status,
		CreatedAt: device.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: device.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	c.JSON(http.StatusOK, response)
}

// UpdateDeviceStatus updates device status
func (h *DeviceHandler) UpdateDeviceStatus(c *gin.Context) {
	deviceID := c.Param("deviceId")
	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Device ID is required"})
		return
	}

	var req UpdateDeviceStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.deviceService.UpdateDeviceStatus(deviceID, req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device status updated successfully"})
}

// DeleteDevice deletes device by ID
func (h *DeviceHandler) DeleteDevice(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	err = h.deviceService.DeleteDevice(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device deleted successfully"})
}
