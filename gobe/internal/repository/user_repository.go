package repository

import (
	"iot/internal/dto"
	"iot/internal/model"
	"log"

	"gorm.io/gorm"
)

type UserRepositoryInterface interface {
	CreateUser(db *gorm.DB, user *model.User) error
	GetByID(db *gorm.DB, id uint) (*model.User, error)
	GetByEmail(db *gorm.DB, email string) (*model.User, error)
	GetAllUsers(db *gorm.DB, limit, offset int) ([]model.User, error)
	UpdateUser(db *gorm.DB, Id uint, data *dto.UpdateUserRequest) error
	DeleteUser(db *gorm.DB, id uint) error
	CheckEmailExists(db *gorm.DB, email string) (bool, error)
}

type UserRepository struct{}

func NewUserRepository() UserRepositoryInterface {
	return &UserRepository{}
}

// CreateUser - tạo user mới

func (r *UserRepository) CreateUser(db *gorm.DB, user *model.User) error {
	return db.Create(user).Error
}

// GetByID - tìm user theo ID
func (r *UserRepository) GetByID(db *gorm.DB, id uint) (*model.User, error) {
	var user model.User
	if err := db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil

}

// GetByEmail - tìm user theo email
func (r *UserRepository) GetByEmail(db *gorm.DB, email string) (*model.User, error) {
	var user model.User
	if err := db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func UpdateUser(db *gorm.DB, user *model.User) error {
	return db.Save(user).Error
}

func (r *UserRepository) UpdateUser(db *gorm.DB, id uint, data *dto.UpdateUserRequest) error {
	// 1. Tìm user theo ID
	var user model.User
	if err := db.First(&user, id).Error; err != nil {
		return err // không tìm thấy user
	}
	user.Name = data.Name
	user.Email = data.Email

	return db.Save(&user).Error
}

func (r *UserRepository) DeleteUser(db *gorm.DB, id uint) error {
	result := db.Unscoped().Where("id = ?", id).Delete(&model.User{})
	if result.RowsAffected == 0 {
		log.Println("No rows affected, user may not exist")
		return gorm.ErrRecordNotFound
	}
	return result.Error
}

func (r *UserRepository) GetAllUsers(db *gorm.DB, limit, offset int) ([]model.User, error) {
	var users []model.User
	if err := db.Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *UserRepository) CheckEmailExists(db *gorm.DB, email string) (bool, error) {
	var count int64
	if err := db.Model(&model.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
