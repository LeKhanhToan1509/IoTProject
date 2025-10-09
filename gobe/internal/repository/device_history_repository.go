package repository

import (
	"fmt"
	"iot/internal/helper"
	"iot/internal/model"
	"regexp"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

const (
	// Local timezone for Vietnam (UTC+7)
	LOCAL_TIMEZONE = "Asia/Ho_Chi_Minh"
)

type DeviceHistoryRepositoryInterface interface {
	CreateDeviceHistory(db *gorm.DB, history *model.DeviceHistory) error
	GetByDeviceID(db *gorm.DB, deviceID uint) (*model.DeviceHistory, error)
	GetAllDeviceHistories(db *gorm.DB, page int, offset int, order string, status string, deviceId string, startDate string, endDate string, search string) ([]model.DeviceHistory, int, error)
}

type DeviceHistoryRepository struct{}

func NewDeviceHistoryRepository() DeviceHistoryRepositoryInterface {
	return &DeviceHistoryRepository{}
}

func (r *DeviceHistoryRepository) CreateDeviceHistory(db *gorm.DB, history *model.DeviceHistory) error {
	return db.Create(history).Error
}

func (r *DeviceHistoryRepository) GetByDeviceID(db *gorm.DB, deviceID uint) (*model.DeviceHistory, error) {
	var history model.DeviceHistory
	if err := db.Where("ID = ?", deviceID).First(&history).Error; err != nil {
		return nil, err
	}
	return &history, nil
}

func (r *DeviceHistoryRepository) GetAllDeviceHistories(db *gorm.DB, Limit int, offset int, order string, status string, deviceId string, startDate string, endDate string, search string) ([]model.DeviceHistory, int, error) {
	var histories []model.DeviceHistory
	var count int64

	// Build query
	query := db.Model(&model.DeviceHistory{})

	// Apply search logic
	if search != "" {
		search = strings.TrimSpace(search)

		// Check if search is an ID (starts with # or pure number)
		if strings.HasPrefix(search, "#") {
			// Remove # and search by ID
			idStr := strings.TrimPrefix(search, "#")
			if id, err := strconv.Atoi(idStr); err == nil {
				query = query.Where("id = ?", id)
			}
		} else if matched, _ := regexp.MatchString(`^\d+$`, search); matched {
			// Pure number - could be ID or device_id
			query = query.Where("id = ? OR device_id = ?", search, search)
		} else if matched, _ := regexp.MatchString(`^\d{2}/\d{2}/\d{4}`, search); matched {
			// Date format: DD/MM/YYYY or partial datetime - convert to YYYY-MM-DD format
			convertedSearch := helper.ConvertDateFormat(search)
			query = helper.ApplyDateTimeSearch(query, convertedSearch)
		} else if matched, _ := regexp.MatchString(`^\d{4}-\d{2}-\d{2}`, search); matched {
			// Date format: YYYY-MM-DD or partial datetime
			query = helper.ApplyDateTimeSearch(query, search)
		} else {
			// Text search - search in device name or other text fields
			query = query.Where("device_name LIKE ?", "%"+search+"%")
		}
	}

	// Apply status filter
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Apply device_id filter
	if deviceId != "" {
		query = query.Where("device_id = ?", deviceId)
	}

	// Apply date range filter
	if startDate != "" && endDate != "" {
		// Parse dates with local timezone (UTC+7)
		loc, _ := time.LoadLocation(LOCAL_TIMEZONE)
		start, err := time.ParseInLocation("2006-01-02", startDate, loc)
		if err == nil {
			end, err := time.ParseInLocation("2006-01-02", endDate, loc)
			if err == nil {
				// Add one day to endDate to include the entire day
				end = end.AddDate(0, 0, 1)
				// Debug logging
				fmt.Printf("Date filter: start=%v, end=%v\n", start, end)
				query = query.Where("created_at >= ? AND created_at < ?", start, end)
			} else {
				fmt.Printf("Error parsing end date: %v\n", err)
			}
		} else {
			fmt.Printf("Error parsing start date: %v\n", err)
		}
	}

	// Get total count
	if err := query.Count(&count).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Order(order).Limit(Limit).Offset(offset).Find(&histories).Error; err != nil {
		return nil, 0, err
	}

	return histories, int(count), nil
}

