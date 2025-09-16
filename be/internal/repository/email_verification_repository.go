package repository

import (
	"iot/internal/model"
	"time"

	"gorm.io/gorm"
)

type EmailVerificationRepositoryInterface interface {
	Create(verification *model.EmailVerification) error
	GetByCode(code string) (*model.EmailVerification, error)
	GetByUserID(userID uint) (*model.EmailVerification, error)
	GetByEmail(email string) (*model.EmailVerification, error)
	MarkAsUsed(id uint) error
	DeleteExpired() error
	Delete(id uint) error
}

type EmailVerificationRepository struct {
	db *gorm.DB
}

func NewEmailVerificationRepository(db *gorm.DB) EmailVerificationRepositoryInterface {
	return &EmailVerificationRepository{db: db}
}

func (r *EmailVerificationRepository) Create(verification *model.EmailVerification) error {
	return r.db.Create(verification).Error
}

func (r *EmailVerificationRepository) GetByCode(code string) (*model.EmailVerification, error) {
	var verification model.EmailVerification
	err := r.db.Where("code = ? AND used = false AND expires_at > ?", code, time.Now()).First(&verification).Error
	return &verification, err
}

func (r *EmailVerificationRepository) GetByUserID(userID uint) (*model.EmailVerification, error) {
	var verification model.EmailVerification
	err := r.db.Where("user_id = ? AND used = false AND expires_at > ?", userID, time.Now()).
		Order("created_at DESC").First(&verification).Error
	return &verification, err
}

func (r *EmailVerificationRepository) GetByEmail(email string) (*model.EmailVerification, error) {
	var verification model.EmailVerification
	err := r.db.Where("email = ? AND used = false AND expires_at > ?", email, time.Now()).
		Order("created_at DESC").First(&verification).Error
	return &verification, err
}

func (r *EmailVerificationRepository) MarkAsUsed(id uint) error {
	return r.db.Model(&model.EmailVerification{}).Where("id = ?", id).Update("used", true).Error
}

func (r *EmailVerificationRepository) DeleteExpired() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&model.EmailVerification{}).Error
}

func (r *EmailVerificationRepository) Delete(id uint) error {
	return r.db.Delete(&model.EmailVerification{}, id).Error
}
