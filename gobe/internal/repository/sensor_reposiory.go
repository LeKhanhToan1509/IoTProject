package repository

import (
	"iot/internal/helper"
	"iot/internal/model"
	"regexp"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

type SensorRepositoryInterface interface {
	CreateSensorData(*gorm.DB, *model.SensorData) error
	DeleteSensorData(*gorm.DB, uint) error
	GetAllSensorData(*gorm.DB, int, int, string, string, string, string, string) ([]model.SensorData, int, error)
	GetLastSensorData(*gorm.DB) (*model.SensorData, error)
	GetSensorDataByID(*gorm.DB, uint) (*model.SensorData, error)
	GetSensorDataByTime(*gorm.DB, string) (*model.SensorData, error)
}

type SensorRepository struct{}

func NewSensorRepository() SensorRepositoryInterface {
	return &SensorRepository{}
}

func (r *SensorRepository) CreateSensorData(db *gorm.DB, data *model.SensorData) error {
	return db.Create(data).Error
}

func (r *SensorRepository) DeleteSensorData(db *gorm.DB, id uint) error {
	var data model.SensorData
	if err := db.First(&data, id).Error; err != nil {
		return err // không tìm thấy dữ liệu
	}
	return db.Unscoped().Delete(&data).Error
}

func (r *SensorRepository) GetAllSensorData(db *gorm.DB, limit, offset int, sort string, order string, startDate string, endDate string, search string) ([]model.SensorData, int, error) {
	var sensorData []model.SensorData
	var count int64

	// Build query
	query := db.Model(&model.SensorData{})

	if search != "" {
		search = strings.TrimSpace(search)

		if strings.HasPrefix(search, "#") {
			// Case 1: Search by ID (#123)
			idStr := strings.TrimPrefix(search, "#")
			if id, err := strconv.Atoi(idStr); err == nil {
				query = query.Where("id = ?", id)
			}

		} else if matched, _ := regexp.MatchString(`^\d+$`, search); matched {
			// Case 2: Pure number
			query = query.Where("id = ? OR sensor_id = ?", search, search)

		} else if matched, _ := regexp.MatchString(`^\d{2}/\d{2}/\d{4}`, search); matched {
			// Case 3: DD/MM/YYYY
			convertedSearch := helper.ConvertDateFormat(search)
			query = helper.ApplyDateTimeSearch(query, convertedSearch)

		} else if matched, _ := regexp.MatchString(`^\d{4}-\d{2}-\d{2}`, search); matched {
			// Case 4: YYYY-MM-DD
			query = helper.ApplyDateTimeSearch(query, search)

		} else if matched, _ := regexp.MatchString(`^\d+(\.\d+)?\s*°[Cc]`, search); matched {
			// Case 5: Temperature 28.9°C -> temperature
			re := regexp.MustCompile(`(\d+(\.\d+)?)`)
			tempVal := re.FindString(search)
			query = query.Where("temperature = ?", tempVal)

		} else if matched, _ := regexp.MatchString(`^\d+(\.\d+)?\s*%`, search); matched {
			// Case 6: Humidity 75% -> humidity
			re := regexp.MustCompile(`(\d+(\.\d+)?)`)
			humVal := re.FindString(search)
			query = query.Where("humidity = ?", humVal)

		} else if matched, _ := regexp.MatchString(`^\d+(\.\d+)?\s*(lux|lx)`, strings.ToLower(search)); matched {
			// Case 7: Light intensity 3779 lux -> light
			re := regexp.MustCompile(`(\d+(\.\d+)?)`)
			lightVal := re.FindString(search)
			query = query.Where("light = ?", lightVal)

		} else {
			// Case 8: Text search
			query = query.Where(
				"sensor_name LIKE ? OR sensor_type LIKE ? OR location LIKE ?",
				"%"+search+"%", "%"+search+"%", "%"+search+"%",
			)
		}
	}

	// Apply date range filter
	if startDate != "" && endDate != "" {
		// Parse dates with local timezone (UTC+7)
		loc, _ := time.LoadLocation("Asia/Ho_Chi_Minh") // hoặc dùng constant LOCAL_TIMEZONE
		start, err := time.ParseInLocation("2006-01-02", startDate, loc)
		if err == nil {
			end, err := time.ParseInLocation("2006-01-02", endDate, loc)
			if err == nil {
				// Add one day to endDate to include the entire day
				end = end.AddDate(0, 0, 1)
				query = query.Where("created_at >= ? AND created_at < ?", start, end)
			}
		}
	}

	// Get total count
	if err := query.Count(&count).Error; err != nil {
		return nil, 0, err
	}

	// Apply sorting - use the sort parameter for field name
	sortBy := sort
	if sortBy == "" {
		sortBy = "created_at" // default sort field
	}
	orderBy := order
	if orderBy == "" {
		orderBy = "desc" // default order
	}

	// Get paginated results with ordering
	if err := query.Order(sortBy + " " + orderBy).Limit(limit).Offset(offset).Find(&sensorData).Error; err != nil {
		return nil, 0, err
	}

	return sensorData, int(count), nil
}

func (r *SensorRepository) GetLastSensorData(db *gorm.DB) (*model.SensorData, error) {
	var data model.SensorData
	if err := db.Order("created_at desc").First(&data).Error; err != nil {
		return nil, err
	}
	return &data, nil
}

func (r *SensorRepository) GetSensorDataByID(db *gorm.DB, id uint) (*model.SensorData, error) {
	var data model.SensorData
	if err := db.First(&data, id).Error; err != nil {
		return nil, err
	}
	return &data, nil
}
func (r *SensorRepository) GetSensorDataByTime(db *gorm.DB, timestampStr string) (*model.SensorData, error) {
	// 1. Parse string thành time.Time
	layout := "15:04:05 02/01/2006" // định dạng của bạn
	t, err := time.Parse(layout, timestampStr)
	if err != nil {
		return nil, err
	}

	// 2. Query GORM
	var data model.SensorData
	if err := db.Where("timestamp = ?", t).First(&data).Error; err != nil {
		return nil, err
	}

	return &data, nil
}
