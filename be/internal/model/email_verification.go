package model

import (
	"time"

	"gorm.io/gorm"
)

// EmailVerification model for storing email verification codes
type EmailVerification struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"not null"`
	Email     string    `json:"email" gorm:"type:varchar(255);not null"`
	Code      string    `json:"code" gorm:"type:varchar(10);not null"`
	Used      bool      `json:"used" gorm:"default:false"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationship
	User User `json:"user" gorm:"foreignKey:UserID"`
}

// PasswordReset model for storing password reset tokens
type PasswordReset struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"not null"`
	Email     string    `json:"email" gorm:"type:varchar(255);not null"`
	Token     string    `json:"token" gorm:"type:varchar(100);not null;uniqueIndex"`
	Used      bool      `json:"used" gorm:"default:false"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationship
	User User `json:"user" gorm:"foreignKey:UserID"`
}

// TableName sets the table name for EmailVerification
func (EmailVerification) TableName() string {
	return "email_verifications"
}

// TableName sets the table name for PasswordReset
func (PasswordReset) TableName() string {
	return "password_resets"
}

// IsExpired checks if the verification code has expired
func (ev *EmailVerification) IsExpired() bool {
	return time.Now().After(ev.ExpiresAt)
}

// IsValid checks if the verification code is valid (not used and not expired)
func (ev *EmailVerification) IsValid() bool {
	return !ev.Used && !ev.IsExpired()
}

// IsExpired checks if the reset token has expired
func (pr *PasswordReset) IsExpired() bool {
	return time.Now().After(pr.ExpiresAt)
}

// IsValid checks if the reset token is valid (not used and not expired)
func (pr *PasswordReset) IsValid() bool {
	return !pr.Used && !pr.IsExpired()
}

// BeforeCreate hook to set expiration times
func (ev *EmailVerification) BeforeCreate(tx *gorm.DB) error {
	if ev.ExpiresAt.IsZero() {
		ev.ExpiresAt = time.Now().Add(15 * time.Minute) // 15 minutes
	}
	return nil
}

// BeforeCreate hook to set expiration times
func (pr *PasswordReset) BeforeCreate(tx *gorm.DB) error {
	if pr.ExpiresAt.IsZero() {
		pr.ExpiresAt = time.Now().Add(1 * time.Hour) // 1 hour
	}
	return nil
}
