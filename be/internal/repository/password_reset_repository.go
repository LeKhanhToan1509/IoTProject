package repository

import (
	"iot/internal/model"
	"time"

	"gorm.io/gorm"
)

type PasswordResetRepositoryInterface interface {
	Create(reset *model.PasswordReset) error
	GetByToken(token string) (*model.PasswordReset, error)
	GetByUserID(userID uint) (*model.PasswordReset, error)
	GetByEmail(email string) (*model.PasswordReset, error)
	MarkAsUsed(id uint) error
	DeleteExpired() error
	Delete(id uint) error
	DeleteByUserID(userID uint) error
}

type PasswordResetRepository struct {
	db *gorm.DB
}

func NewPasswordResetRepository(db *gorm.DB) PasswordResetRepositoryInterface {
	return &PasswordResetRepository{db: db}
}

func (r *PasswordResetRepository) Create(reset *model.PasswordReset) error {
	return r.db.Create(reset).Error
}

func (r *PasswordResetRepository) GetByToken(token string) (*model.PasswordReset, error) {
	var reset model.PasswordReset
	err := r.db.Where("token = ? AND used = false AND expires_at > ?", token, time.Now()).First(&reset).Error
	return &reset, err
}

func (r *PasswordResetRepository) GetByUserID(userID uint) (*model.PasswordReset, error) {
	var reset model.PasswordReset
	err := r.db.Where("user_id = ? AND used = false AND expires_at > ?", userID, time.Now()).
		Order("created_at DESC").First(&reset).Error
	return &reset, err
}

func (r *PasswordResetRepository) GetByEmail(email string) (*model.PasswordReset, error) {
	var reset model.PasswordReset
	err := r.db.Where("email = ? AND used = false AND expires_at > ?", email, time.Now()).
		Order("created_at DESC").First(&reset).Error
	return &reset, err
}

func (r *PasswordResetRepository) MarkAsUsed(id uint) error {
	return r.db.Model(&model.PasswordReset{}).Where("id = ?", id).Update("used", true).Error
}

func (r *PasswordResetRepository) DeleteExpired() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&model.PasswordReset{}).Error
}

func (r *PasswordResetRepository) Delete(id uint) error {
	return r.db.Delete(&model.PasswordReset{}, id).Error
}

func (r *PasswordResetRepository) DeleteByUserID(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&model.PasswordReset{}).Error
}
