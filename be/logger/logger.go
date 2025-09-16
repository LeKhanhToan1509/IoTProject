package logger

import (
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	Log    *zap.Logger
	Sugar  *zap.SugaredLogger
	logger *Logger
)

type Logger struct {
	zap   *zap.Logger
	sugar *zap.SugaredLogger
}

// LogConfig holds logger configuration
type LogConfig struct {
	Level      string `json:"level" env:"LOG_LEVEL" default:"info"`
	Format     string `json:"format" env:"LOG_FORMAT" default:"json"`   // json or console
	Output     string `json:"output" env:"LOG_OUTPUT" default:"stdout"` // stdout, stderr, file
	FilePath   string `json:"file_path" env:"LOG_FILE_PATH" default:"logs/app.log"`
	MaxSize    int    `json:"max_size" env:"LOG_MAX_SIZE" default:"100"` // MB
	MaxBackups int    `json:"max_backups" env:"LOG_MAX_BACKUPS" default:"3"`
	MaxAge     int    `json:"max_age" env:"LOG_MAX_AGE" default:"30"` // days
}

func InitLogger() {
	config := &LogConfig{
		Level:      "info",
		Format:     "json",
		Output:     "stdout",
		FilePath:   "logs/app.log",
		MaxSize:    100,
		MaxBackups: 3,
		MaxAge:     30,
	}
	InitLoggerWithConfig(config)
}

func InitLoggerWithConfig(config *LogConfig) {
	var err error
	logger, err = NewLogger(config)
	if err != nil {
		panic(err)
	}

	// Set global variables for easy access
	Log = logger.zap
	Sugar = logger.sugar
}

// NewLogger creates a new logger instance with the given configuration
func NewLogger(config *LogConfig) (*Logger, error) {
	// Parse log level
	level, err := zapcore.ParseLevel(config.Level)
	if err != nil {
		level = zapcore.InfoLevel
	}

	// Create encoder config
	var encoderConfig zapcore.EncoderConfig
	if config.Format == "console" {
		encoderConfig = zap.NewDevelopmentEncoderConfig()
		encoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("2006-01-02 15:04:05")
		encoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	} else {
		encoderConfig = zap.NewProductionEncoderConfig()
		encoderConfig.TimeKey = "timestamp"
		encoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout("2006-01-02T15:04:05.000Z07:00")
	}

	// Create encoder
	var encoder zapcore.Encoder
	if config.Format == "console" {
		encoder = zapcore.NewConsoleEncoder(encoderConfig)
	} else {
		encoder = zapcore.NewJSONEncoder(encoderConfig)
	}

	// Create writer syncer
	var writeSyncer zapcore.WriteSyncer
	switch config.Output {
	case "stderr":
		writeSyncer = zapcore.AddSync(os.Stderr)
	case "file":
		// Create logs directory if it doesn't exist
		if err := os.MkdirAll("logs", 0755); err != nil {
			return nil, err
		}
		file, err := os.OpenFile(config.FilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err != nil {
			return nil, err
		}
		writeSyncer = zapcore.AddSync(file)
	default: // stdout
		writeSyncer = zapcore.AddSync(os.Stdout)
	}

	// Create core
	core := zapcore.NewCore(encoder, writeSyncer, level)

	// Create logger with caller info
	zapLogger := zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1), zap.AddStacktrace(zapcore.ErrorLevel))

	return &Logger{
		zap:   zapLogger,
		sugar: zapLogger.Sugar(),
	}, nil
}

// GetLogger returns the global logger instance
func GetLogger() *Logger {
	if logger == nil {
		InitLogger()
	}
	return logger
}

// Convenience methods for the global logger
func Debug(msg string, fields ...zap.Field) {
	Log.Debug(msg, fields...)
}

func Info(msg string, fields ...zap.Field) {
	Log.Info(msg, fields...)
}

func Warn(msg string, fields ...zap.Field) {
	Log.Warn(msg, fields...)
}

func Error(msg string, fields ...zap.Field) {
	Log.Error(msg, fields...)
}

func Fatal(msg string, fields ...zap.Field) {
	Log.Fatal(msg, fields...)
}

func Panic(msg string, fields ...zap.Field) {
	Log.Panic(msg, fields...)
}

// Sugar logger convenience methods (printf-style)
func Debugf(template string, args ...interface{}) {
	Sugar.Debugf(template, args...)
}

func Infof(template string, args ...interface{}) {
	Sugar.Infof(template, args...)
}

func Warnf(template string, args ...interface{}) {
	Sugar.Warnf(template, args...)
}

func Errorf(template string, args ...interface{}) {
	Sugar.Errorf(template, args...)
}

func Fatalf(template string, args ...interface{}) {
	Sugar.Fatalf(template, args...)
}

func Panicf(template string, args ...interface{}) {
	Sugar.Panicf(template, args...)
}

// Structured logging helpers
func LogHTTPRequest(method, path, ip string, statusCode int, duration time.Duration) {
	Log.Info("HTTP Request",
		zap.String("method", method),
		zap.String("path", path),
		zap.String("ip", ip),
		zap.Int("status_code", statusCode),
		zap.Duration("duration", duration),
	)
}

func LogDatabaseQuery(query string, duration time.Duration, err error) {
	if err != nil {
		Log.Error("Database Query Failed",
			zap.String("query", query),
			zap.Duration("duration", duration),
			zap.Error(err),
		)
	} else {
		Log.Debug("Database Query",
			zap.String("query", query),
			zap.Duration("duration", duration),
		)
	}
}

func LogServiceCall(service, method string, duration time.Duration, err error) {
	if err != nil {
		Log.Error("Service Call Failed",
			zap.String("service", service),
			zap.String("method", method),
			zap.Duration("duration", duration),
			zap.Error(err),
		)
	} else {
		Log.Info("Service Call",
			zap.String("service", service),
			zap.String("method", method),
			zap.Duration("duration", duration),
		)
	}
}

func Close() {
	if Log != nil {
		Log.Sync()
	}
}
