package mailer

import (
	"context"
	"iot/internal/helper"
	"iot/pkg/config"

	"go.uber.org/zap"
)

type MailService struct {
	cfg    *config.EmailConfig
	logger *zap.Logger
}

func NewMailService(cfg *config.EmailConfig, logger *zap.Logger) *MailService {
	return &MailService{cfg: cfg, logger: logger}
}

func (s *MailService) Send(ctx context.Context, sender EmailSender, to string, data map[string]string) error {
	s.logger.Info("Attempting to send email",
		zap.String("to", to),
		zap.String("smtp_host", s.cfg.Host),
		zap.String("smtp_username", s.cfg.Username))

	msg := sender.BuildMessage(to, data)
	err := helper.SendMail(ctx, s.cfg, msg, s.logger)

	if err != nil {
		s.logger.Error("Failed to send email",
			zap.Error(err),
			zap.String("to", to))
		return err
	}

	s.logger.Info("Email sent successfully", zap.String("to", to))
	return nil
}

func (s *MailService) GenerateOTP() string {
	return helper.GenerateOTP()
}
