package helper

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"iot/pkg/config"
	"net"
	"net/smtp"
	"strings"
	"time"

	"go.uber.org/zap"
)

// Config SMTP

// MailMessage
type MailMessage struct {
	From        string
	To          []string
	Subject     string
	Body        string
	IsHTML      bool
	ContentType string
}

func SendMail(ctx context.Context, cfg *config.EmailConfig, msg *MailMessage, logger *zap.Logger) error {
	if cfg == nil || msg == nil {
		return errors.New("config and msg must not be nil")
	}

	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 10 * time.Second
	}

	from := msg.From
	if from == "" {
		from = cfg.From
	}
	if from == "" {
		return errors.New("from address is empty")
	}
	toList := msg.To
	if len(toList) == 0 {
		return errors.New("recipient (To) is empty")
	}

	var contentType string
	if msg.ContentType != "" {
		contentType = msg.ContentType
	} else if msg.IsHTML {
		contentType = "text/html; charset=UTF-8"
	} else {
		contentType = "text/plain; charset=UTF-8"
	}

	// headers
	headers := make(map[string]string)
	headers["From"] = from
	headers["To"] = strings.Join(toList, ", ")
	headers["Subject"] = msg.Subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = contentType

	var bodyBuilder strings.Builder
	for k, v := range headers {
		bodyBuilder.WriteString(k + ": " + v + "\r\n")
	}
	bodyBuilder.WriteString("\r\n")
	bodyBuilder.WriteString(msg.Body)

	fullMsg := []byte(bodyBuilder.String())
	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)

	sendFunc := func() error {
		auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)

		if cfg.UseTLS {
			tlsConfig := &tls.Config{
				InsecureSkipVerify: false,
				ServerName:         cfg.Host,
			}
			conn, err := tls.DialWithDialer(&net.Dialer{Timeout: timeout}, "tcp", addr, tlsConfig)
			if err != nil {
				logger.Error("TLS dial error", zap.Error(err))
				return err
			}
			c, err := smtp.NewClient(conn, cfg.Host)
			if err != nil {
				logger.Error("Create SMTP client error", zap.Error(err))
				return err
			}
			defer c.Quit()

			if err := c.Auth(auth); err != nil {
				logger.Error("SMTP auth error", zap.Error(err))
				return err
			}
			if err := c.Mail(from); err != nil {
				logger.Error("SMTP from error", zap.Error(err))
				return err
			}
			for _, rcpt := range toList {
				if err := c.Rcpt(rcpt); err != nil {
					logger.Error("SMTP rcpt error", zap.String("recipient", rcpt), zap.Error(err))
					return err
				}
			}
			w, err := c.Data()
			if err != nil {
				logger.Error("SMTP data error", zap.Error(err))
				return err
			}
			if _, err = w.Write(fullMsg); err != nil {
				logger.Error("SMTP write message error", zap.Error(err))
				return err
			}
			if err := w.Close(); err != nil {
				logger.Error("SMTP close writer error", zap.Error(err))
				return err
			}
			logger.Info("Mail sent successfully (TLS)", zap.Strings("to", toList))
			return nil
		}

		// STARTTLS mode
		client, err := smtp.Dial(addr)
		if err != nil {
			logger.Error("SMTP dial error", zap.Error(err))
			return err
		}
		defer client.Close()

		if ok, _ := client.Extension("STARTTLS"); ok {
			tlsConfig := &tls.Config{ServerName: cfg.Host}
			if err := client.StartTLS(tlsConfig); err != nil {
				logger.Error("STARTTLS error", zap.Error(err))
				return err
			}
		}

		if err := client.Auth(auth); err != nil {
			logger.Error("SMTP auth error", zap.Error(err))
			return err
		}

		if err := client.Mail(from); err != nil {
			logger.Error("SMTP from error", zap.Error(err))
			return err
		}
		for _, rcpt := range toList {
			if err := client.Rcpt(rcpt); err != nil {
				logger.Error("SMTP rcpt error", zap.String("recipient", rcpt), zap.Error(err))
				return err
			}
		}
		w, err := client.Data()
		if err != nil {
			logger.Error("SMTP data error", zap.Error(err))
			return err
		}
		if _, err = w.Write(fullMsg); err != nil {
			logger.Error("SMTP write message error", zap.Error(err))
			return err
		}
		if err := w.Close(); err != nil {
			logger.Error("SMTP close writer error", zap.Error(err))
			return err
		}
		logger.Info("Mail sent successfully (STARTTLS)", zap.Strings("to", toList))
		return nil
	}

	// Gọi trực tiếp sendFunc mà không cần goroutine
	// Timeout sẽ được handle ở level SMTP connection
	return sendFunc()
}
func GenerateOTP() string {
	const otpLength = 6
	const digits = "0123456789"
	otp := make([]byte, otpLength)
	for i := range otp {
		otp[i] = digits[time.Now().UnixNano()%int64(len(digits))]
		time.Sleep(time.Nanosecond) // ensure different seed
	}
	return string(otp)
}
