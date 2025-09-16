package logger

import (
	"time"

	"go.uber.org/zap"
)

// Repository logging helpers
func LogRepositoryOperation(repo, operation string, duration time.Duration, err error) {
	if err != nil {
		Error("Repository operation failed",
			zap.String("repository", repo),
			zap.String("operation", operation),
			zap.Duration("duration", duration),
			zap.Error(err),
		)
	} else {
		Debug("Repository operation",
			zap.String("repository", repo),
			zap.String("operation", operation),
			zap.Duration("duration", duration),
		)
	}
}

// Service logging helpers
func LogServiceOperation(service, operation string, duration time.Duration, err error) {
	if err != nil {
		Error("Service operation failed",
			zap.String("service", service),
			zap.String("operation", operation),
			zap.Duration("duration", duration),
			zap.Error(err),
		)
	} else {
		Info("Service operation",
			zap.String("service", service),
			zap.String("operation", operation),
			zap.Duration("duration", duration),
		)
	}
}

// Handler logging helpers
func LogHandlerOperation(handler, operation string, statusCode int, err error) {
	if err != nil {
		Error("Handler operation failed",
			zap.String("handler", handler),
			zap.String("operation", operation),
			zap.Int("status_code", statusCode),
			zap.Error(err),
		)
	} else {
		Info("Handler operation",
			zap.String("handler", handler),
			zap.String("operation", operation),
			zap.Int("status_code", statusCode),
		)
	}
}

// Database logging helpers
func LogDatabaseConnection(dbType, host string, success bool, err error) {
	if success {
		Info("Database connected successfully",
			zap.String("type", dbType),
			zap.String("host", host),
		)
	} else {
		Error("Database connection failed",
			zap.String("type", dbType),
			zap.String("host", host),
			zap.Error(err),
		)
	}
}

func LogDatabaseMigration(table string, success bool, err error) {
	if success {
		Info("Database migration completed",
			zap.String("table", table),
		)
	} else {
		Error("Database migration failed",
			zap.String("table", table),
			zap.Error(err),
		)
	}
}

// Application lifecycle logging
func LogAppStart(port string) {
	Info("Application started",
		zap.String("port", port),
		zap.String("env", "development"), // Can be made configurable
	)
}

func LogAppShutdown() {
	Info("Application shutting down")
}

// Validation logging
func LogValidationError(field, value, rule string) {
	Warn("Validation failed",
		zap.String("field", field),
		zap.String("value", value),
		zap.String("rule", rule),
	)
}

// Security logging
func LogSecurityEvent(event, ip, userAgent string, severity string) {
	switch severity {
	case "high":
		Error("Security event",
			zap.String("event", event),
			zap.String("ip", ip),
			zap.String("user_agent", userAgent),
			zap.String("severity", severity),
		)
	case "medium":
		Warn("Security event",
			zap.String("event", event),
			zap.String("ip", ip),
			zap.String("user_agent", userAgent),
			zap.String("severity", severity),
		)
	default:
		Info("Security event",
			zap.String("event", event),
			zap.String("ip", ip),
			zap.String("user_agent", userAgent),
			zap.String("severity", severity),
		)
	}
}

func LogBusinessEvent(event string, data map[string]interface{}) {
	fields := make([]zap.Field, 0, len(data)+1)
	fields = append(fields, zap.String("event", event))

	for k, v := range data {
		fields = append(fields, zap.Any(k, v))
	}

	Info("Business event", fields...)
}

func LogPerformanceMetric(metric string, value float64, unit string) {
	Info("Performance metric",
		zap.String("metric", metric),
		zap.Float64("value", value),
		zap.String("unit", unit),
	)
}
