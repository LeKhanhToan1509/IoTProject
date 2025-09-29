package config

import "time"

type EmailConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	Timeout  time.Duration
	UseTLS   bool
}

type MailMessageConfig struct {
	From        string
	To          []string
	Subject     string
	Body        string
	IsHTML      bool
	ContentType string
}
