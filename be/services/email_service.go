package services

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"html/template"
	"iot/logger"
	"net/smtp"
	"os"
	"time"

	"go.uber.org/zap"
)

type EmailServiceInterface interface {
	SendVerificationEmail(email, name, verificationCode string) error
	SendPasswordResetEmail(email, name, resetToken string) error
	SendWelcomeEmail(email, name string) error
	SendPasswordChangedNotification(email, name string) error
	GenerateVerificationCode() (string, error)
	GenerateResetToken() (string, error)
}

type EmailService struct {
	smtpHost     string
	smtpPort     string
	smtpUsername string
	smtpPassword string
	fromEmail    string
	fromName     string
}

type EmailTemplate struct {
	Subject string
	Body    string
	IsHTML  bool
}

func NewEmailService() EmailServiceInterface {
	return &EmailService{
		smtpHost:     getEnvOrDefault("SMTP_HOST", "smtp.gmail.com"),
		smtpPort:     getEnvOrDefault("SMTP_PORT", "587"),
		smtpUsername: getEnvOrDefault("SMTP_USERNAME", ""),
		smtpPassword: getEnvOrDefault("SMTP_PASSWORD", ""),
		fromEmail:    getEnvOrDefault("FROM_EMAIL", "noreply@iotapp.com"),
		fromName:     getEnvOrDefault("FROM_NAME", "IoT Application"),
	}
}

// SendVerificationEmail sends email verification code
func (s *EmailService) SendVerificationEmail(email, name, verificationCode string) error {
	start := time.Now()

	if !s.isConfigured() {
		err := errors.New("email service not configured")
		logger.LogServiceOperation("EmailService", "SendVerificationEmail", time.Since(start), err)
		return err
	}

	template := s.getVerificationEmailTemplate(name, verificationCode)

	if err := s.sendEmail(email, template); err != nil {
		logger.LogServiceOperation("EmailService", "SendVerificationEmail", time.Since(start), err)
		return err
	}

	logger.LogBusinessEvent("verification_email_sent", map[string]interface{}{
		"email": email,
		"name":  name,
	})

	logger.LogServiceOperation("EmailService", "SendVerificationEmail", time.Since(start), nil)
	return nil
}

// SendPasswordResetEmail sends password reset email
func (s *EmailService) SendPasswordResetEmail(email, name, resetToken string) error {
	start := time.Now()

	if !s.isConfigured() {
		err := errors.New("email service not configured")
		logger.LogServiceOperation("EmailService", "SendPasswordResetEmail", time.Since(start), err)
		return err
	}

	template := s.getPasswordResetEmailTemplate(name, resetToken)

	if err := s.sendEmail(email, template); err != nil {
		logger.LogServiceOperation("EmailService", "SendPasswordResetEmail", time.Since(start), err)
		return err
	}

	logger.LogBusinessEvent("password_reset_email_sent", map[string]interface{}{
		"email": email,
		"name":  name,
	})

	logger.LogServiceOperation("EmailService", "SendPasswordResetEmail", time.Since(start), nil)
	return nil
}

// SendWelcomeEmail sends welcome email after successful registration
func (s *EmailService) SendWelcomeEmail(email, name string) error {
	start := time.Now()

	if !s.isConfigured() {
		err := errors.New("email service not configured")
		logger.LogServiceOperation("EmailService", "SendWelcomeEmail", time.Since(start), err)
		return err
	}

	template := s.getWelcomeEmailTemplate(name)

	if err := s.sendEmail(email, template); err != nil {
		logger.LogServiceOperation("EmailService", "SendWelcomeEmail", time.Since(start), err)
		return err
	}

	logger.LogBusinessEvent("welcome_email_sent", map[string]interface{}{
		"email": email,
		"name":  name,
	})

	logger.LogServiceOperation("EmailService", "SendWelcomeEmail", time.Since(start), nil)
	return nil
}

// SendPasswordChangedNotification sends notification when password is changed
func (s *EmailService) SendPasswordChangedNotification(email, name string) error {
	start := time.Now()

	if !s.isConfigured() {
		err := errors.New("email service not configured")
		logger.LogServiceOperation("EmailService", "SendPasswordChangedNotification", time.Since(start), err)
		return err
	}

	template := s.getPasswordChangedEmailTemplate(name)

	if err := s.sendEmail(email, template); err != nil {
		logger.LogServiceOperation("EmailService", "SendPasswordChangedNotification", time.Since(start), err)
		return err
	}

	logger.LogBusinessEvent("password_changed_email_sent", map[string]interface{}{
		"email": email,
		"name":  name,
	})

	logger.LogServiceOperation("EmailService", "SendPasswordChangedNotification", time.Since(start), nil)
	return nil
}

// GenerateVerificationCode generates a 6-digit verification code
func (s *EmailService) GenerateVerificationCode() (string, error) {
	bytes := make([]byte, 3)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	// Convert to 6-digit number
	code := fmt.Sprintf("%06d", int(bytes[0])<<16|int(bytes[1])<<8|int(bytes[2]))
	if len(code) > 6 {
		code = code[:6]
	}

	return code, nil
}

// GenerateResetToken generates a secure reset token
func (s *EmailService) GenerateResetToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// Private helper methods

func (s *EmailService) isConfigured() bool {
	return s.smtpUsername != "" && s.smtpPassword != "" && s.fromEmail != ""
}

func (s *EmailService) sendEmail(to string, emailTemplate *EmailTemplate) error {
	// Create message
	message := s.createMessage(to, emailTemplate)

	// Setup authentication
	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)

	// Send email
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)
	err := smtp.SendMail(addr, auth, s.fromEmail, []string{to}, []byte(message))

	if err != nil {
		logger.Error("Failed to send email",
			zap.String("to", to),
			zap.String("subject", emailTemplate.Subject),
			zap.Error(err),
		)
		return fmt.Errorf("failed to send email: %w", err)
	}

	logger.Info("Email sent successfully",
		zap.String("to", to),
		zap.String("subject", emailTemplate.Subject),
	)

	return nil
}

func (s *EmailService) createMessage(to string, emailTemplate *EmailTemplate) string {
	var contentType string
	if emailTemplate.IsHTML {
		contentType = "text/html; charset=UTF-8"
	} else {
		contentType = "text/plain; charset=UTF-8"
	}

	message := fmt.Sprintf("To: %s\r\n", to)
	message += fmt.Sprintf("From: %s <%s>\r\n", s.fromName, s.fromEmail)
	message += fmt.Sprintf("Subject: %s\r\n", emailTemplate.Subject)
	message += fmt.Sprintf("Content-Type: %s\r\n", contentType)
	message += "\r\n"
	message += emailTemplate.Body

	return message
}

// Email templates

func (s *EmailService) getVerificationEmailTemplate(name, verificationCode string) *EmailTemplate {
	tmplStr := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Email Verification</h2>
        <p>Hello {{.Name}},</p>
        <p>Thank you for registering with our IoT Application. Please use the verification code below to verify your email address:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">{{.Code}}</h1>
        </div>
        
        <p>This verification code will expire in 15 minutes for security reasons.</p>
        <p>If you didn't create an account with us, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
            This is an automated message, please do not reply to this email.
        </p>
    </div>
</body>
</html>`

	tmpl, err := template.New("verification").Parse(tmplStr)
	if err != nil {
		logger.Error("Failed to parse verification email template", zap.Error(err))
		return s.getFallbackVerificationTemplate(name, verificationCode)
	}

	var body bytes.Buffer
	data := struct {
		Name string
		Code string
	}{
		Name: name,
		Code: verificationCode,
	}

	if err := tmpl.Execute(&body, data); err != nil {
		logger.Error("Failed to execute verification email template", zap.Error(err))
		return s.getFallbackVerificationTemplate(name, verificationCode)
	}

	return &EmailTemplate{
		Subject: "Verify Your Email Address - IoT Application",
		Body:    body.String(),
		IsHTML:  true,
	}
}

func (s *EmailService) getPasswordResetEmailTemplate(name, resetToken string) *EmailTemplate {
	resetURL := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", resetToken)

	tmplStr := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        <p>Hello {{.Name}},</p>
        <p>We received a request to reset your password for your IoT Application account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{.ResetURL}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
            </a>
        </div>
        
        <p>If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">{{.ResetURL}}</p>
        
        <p>This password reset link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
            This is an automated message, please do not reply to this email.
        </p>
    </div>
</body>
</html>`

	tmpl, err := template.New("passwordReset").Parse(tmplStr)
	if err != nil {
		logger.Error("Failed to parse password reset email template", zap.Error(err))
		return s.getFallbackPasswordResetTemplate(name, resetToken)
	}

	var body bytes.Buffer
	data := struct {
		Name     string
		ResetURL string
	}{
		Name:     name,
		ResetURL: resetURL,
	}

	if err := tmpl.Execute(&body, data); err != nil {
		logger.Error("Failed to execute password reset email template", zap.Error(err))
		return s.getFallbackPasswordResetTemplate(name, resetToken)
	}

	return &EmailTemplate{
		Subject: "Password Reset Request - IoT Application",
		Body:    body.String(),
		IsHTML:  true,
	}
}

func (s *EmailService) getWelcomeEmailTemplate(name string) *EmailTemplate {
	tmplStr := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Welcome to IoT Application!</h2>
        <p>Hello {{.Name}},</p>
        <p>Welcome to our IoT Application! We're excited to have you on board.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Getting Started</h3>
            <ul>
                <li>Connect your IoT devices</li>
                <li>Monitor sensor data in real-time</li>
                <li>Set up alerts and notifications</li>
                <li>Analyze historical data</li>
            </ul>
        </div>
        
        <p>If you have any questions or need assistance, feel free to contact our support team.</p>
        <p>Thank you for choosing our IoT Application!</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
            This is an automated message, please do not reply to this email.
        </p>
    </div>
</body>
</html>`

	tmpl, err := template.New("welcome").Parse(tmplStr)
	if err != nil {
		logger.Error("Failed to parse welcome email template", zap.Error(err))
		return s.getFallbackWelcomeTemplate(name)
	}

	var body bytes.Buffer
	data := struct {
		Name string
	}{
		Name: name,
	}

	if err := tmpl.Execute(&body, data); err != nil {
		logger.Error("Failed to execute welcome email template", zap.Error(err))
		return s.getFallbackWelcomeTemplate(name)
	}

	return &EmailTemplate{
		Subject: "Welcome to IoT Application!",
		Body:    body.String(),
		IsHTML:  true,
	}
}

func (s *EmailService) getPasswordChangedEmailTemplate(name string) *EmailTemplate {
	body := fmt.Sprintf(`
Hello %s,

Your password has been successfully changed.

If you did not make this change, please contact our support team immediately.

Best regards,
IoT Application Team

---
This is an automated message, please do not reply to this email.
`, name)

	return &EmailTemplate{
		Subject: "Password Changed - IoT Application",
		Body:    body,
		IsHTML:  false,
	}
}

// Fallback templates (plain text)

func (s *EmailService) getFallbackVerificationTemplate(name, verificationCode string) *EmailTemplate {
	body := fmt.Sprintf(`
Hello %s,

Thank you for registering with our IoT Application. Please use the verification code below to verify your email address:

Verification Code: %s

This verification code will expire in 15 minutes for security reasons.

If you didn't create an account with us, please ignore this email.

Best regards,
IoT Application Team

---
This is an automated message, please do not reply to this email.
`, name, verificationCode)

	return &EmailTemplate{
		Subject: "Verify Your Email Address - IoT Application",
		Body:    body,
		IsHTML:  false,
	}
}

func (s *EmailService) getFallbackPasswordResetTemplate(name, resetToken string) *EmailTemplate {
	resetURL := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", resetToken)

	body := fmt.Sprintf(`
Hello %s,

We received a request to reset your password for your IoT Application account.

Please click on the following link to reset your password:
%s

This password reset link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email.

Best regards,
IoT Application Team

---
This is an automated message, please do not reply to this email.
`, name, resetURL)

	return &EmailTemplate{
		Subject: "Password Reset Request - IoT Application",
		Body:    body,
		IsHTML:  false,
	}
}

func (s *EmailService) getFallbackWelcomeTemplate(name string) *EmailTemplate {
	body := fmt.Sprintf(`
Hello %s,

Welcome to our IoT Application! We're excited to have you on board.

Getting Started:
- Connect your IoT devices
- Monitor sensor data in real-time
- Set up alerts and notifications
- Analyze historical data

If you have any questions or need assistance, feel free to contact our support team.

Thank you for choosing our IoT Application!

Best regards,
IoT Application Team

---
This is an automated message, please do not reply to this email.
`, name)

	return &EmailTemplate{
		Subject: "Welcome to IoT Application!",
		Body:    body,
		IsHTML:  false,
	}
}

// Helper function
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
