package helper

import (
	"fmt"
	"regexp"
	"time"

	"gorm.io/gorm"
)

func ApplyDateTimeSearch(query *gorm.DB, search string) *gorm.DB {
	LOCAL_TIMEZONE := "Asia/Ho_Chi_Minh"
	formats := []struct {
		pattern string
		layout  string
		addTime bool
	}{
		{`^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$`, "2006-01-02 15:04:05", false},
		{`^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$`, "2006-01-02 15:04", true},
		{`^\d{4}-\d{2}-\d{2}\s+\d{2}$`, "2006-01-02 15", true},
		{`^\d{4}-\d{2}-\d{2}$`, "2006-01-02", true},
	}

	for _, format := range formats {
		if matched, _ := regexp.MatchString(format.pattern, search); matched {
			fmt.Printf("Matched pattern: %s, layout: %s, search: %s\n", format.pattern, format.layout, search)
			// Parse with local timezone (UTC+7)
			loc, _ := time.LoadLocation(LOCAL_TIMEZONE)
			if t, err := time.ParseInLocation(format.layout, search, loc); err == nil {
				fmt.Printf("Parsed time: %v\n", t)
				if format.addTime {
					// Calculate end time based on precision
					var endTime time.Time
					switch format.layout {
					case "2006-01-02":
						// Search entire day
						endTime = t.AddDate(0, 0, 1)
					case "2006-01-02 15":
						// Search entire hour
						endTime = t.Add(time.Hour)
					case "2006-01-02 15:04":
						// Search entire minute
						endTime = t.Add(time.Minute)
					}
					return query.Where("created_at >= ? AND created_at < ?", t, endTime)
				} else {
					// Exact second match
					endTime := t.Add(time.Second)
					return query.Where("created_at >= ? AND created_at < ?", t, endTime)
				}
			}
		}
	}

	return query
}

func ConvertDateFormat(input string) string {
	patterns := []struct {
		from string
		to   string
	}{
		{`(\d{2})/(\d{2})/(\d{4})\s+(\d{2}:\d{2}:\d{2})`, "$3-$2-$1 $4"},
		{`(\d{2})/(\d{2})/(\d{4})\s+(\d{2}:\d{2})`, "$3-$2-$1 $4"},
		{`(\d{2})/(\d{2})/(\d{4})\s+(\d{2})`, "$3-$2-$1 $4"},
		{`(\d{2})/(\d{2})/(\d{4})`, "$3-$2-$1"},
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern.from)
		if re.MatchString(input) {
			result := re.ReplaceAllString(input, pattern.to)
			fmt.Printf("Converted date format: %s -> %s\n", input, result)
			return result
		}
	}

	return input
}
