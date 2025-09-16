package repository

import (
	"iot/internal/model"

	"gorm.io/gorm"
)

type UserRepositoryInterface interface {
	Create(user *model.User) error
	GetAll(limit, offset int, orderBy string) ([]*model.User, error)
	GetByID(id uint) (*model.User, error)
	GetByEmail(email string) (*model.User, error)
	Update(user *model.User) error
	DeleteByID(id uint) error
}

type UserRepository struct {
	db *gorm.DB
}

// Khởi tạo repo
func NewUserRepository(db *gorm.DB) UserRepositoryInterface {
	return &UserRepository{db: db}
}

// Create user
func (r *UserRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) GetAll(limit, offset int, orderBy string) ([]*model.User, error) {
	var users []*model.User

	query := r.db.Model(&model.User{})

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	if orderBy == "" {
		orderBy = "id ASC"
	}
	query = query.Order(orderBy)

	err := query.Find(&users).Error
	return users, err
}

func (r *UserRepository) GetByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, id).Error
	return &user, err
}

func (r *UserRepository) GetByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *UserRepository) Update(user *model.User) error {
	if user.ID == 0 {
		return gorm.ErrMissingWhereClause
	}
	return r.db.Save(user).Error
}

func (r *UserRepository) DeleteByID(id uint) error {
	return r.db.Delete(&model.User{}, id).Error
}
