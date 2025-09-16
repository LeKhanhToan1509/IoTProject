package services

import (
	"errors"
	"iot/internal/model"
	"iot/internal/repository"
	"strings"
)

type UserServiceInterface interface {
	CreateUser(name, email, password string) error
	GetAllUsers(limit, offset int, orderBy string) ([]*model.User, error)
	GetUserByID(id uint) (*model.User, error)
	UpdateUser(user *model.User) error
	DeleteUser(id uint) error
}

type UserService struct {
	userRepo repository.UserRepositoryInterface
}

func NewUserService(userRepo repository.UserRepositoryInterface) UserServiceInterface {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) CreateUser(name, email, password string) error {
	// Validate input
	if strings.TrimSpace(name) == "" {
		return errors.New("name is required")
	}
	if strings.TrimSpace(email) == "" {
		return errors.New("email is required")
	}
	if strings.TrimSpace(password) == "" {
		return errors.New("password is required")
	}
	if len(password) < 6 {
		return errors.New("password must be at least 6 characters")
	}

	user := &model.User{
		Name:     strings.TrimSpace(name),
		Email:    strings.TrimSpace(email),
		Password: password, // In production, should hash this
	}

	return s.userRepo.Create(user)
}

func (s *UserService) GetAllUsers(limit, offset int, orderBy string) ([]*model.User, error) {
	return s.userRepo.GetAll(limit, offset, orderBy)
}

func (s *UserService) GetUserByID(id uint) (*model.User, error) {
	if id == 0 {
		return nil, errors.New("invalid user ID")
	}
	return s.userRepo.GetByID(id)
}
 
func (s *UserService) UpdateUser(user *model.User) error {
	if user == nil {
		return errors.New("user cannot be nil")
	}
	if user.ID == 0 {
		return errors.New("user ID is required")
	}
	if strings.TrimSpace(user.Name) == "" {
		return errors.New("name is required")
	}
	if strings.TrimSpace(user.Email) == "" {
		return errors.New("email is required")
	}

	return s.userRepo.Update(user)
}

func (s *UserService) DeleteUser(id uint) error {
	if id == 0 {
		return errors.New("invalid user ID")
	}

	// Check if user exists
	_, err := s.userRepo.GetByID(id)
	if err != nil {
		return errors.New("user not found")
	}

	return s.userRepo.DeleteByID(id)
}
