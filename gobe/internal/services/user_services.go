package services

import (
	"context"
	"fmt"
	"iot/internal/dto"
	"iot/internal/helper/mailer"
	"iot/internal/jwt_utils"
	"iot/internal/model"
	"iot/internal/repository"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Định nghĩa interface cho UserService
type UserServiceInterface interface {
	RegisterOTP(db *gorm.DB, userDto *dto.CreateUserRequest, mailer_service *mailer.MailService, redis *redis.Client) (*dto.CreateUserResponseWithOTP, error)
	Register(db *gorm.DB, userDto *dto.RegisterRequest, mailer_service *mailer.MailService, redis *redis.Client) (*dto.RegisterResponse, error)
	Login(db *gorm.DB, email, password string) (*dto.LoginResponse, error)
	GetUserByID(db *gorm.DB, id uint) (*model.User, error)
	GetAllUsers(db *gorm.DB, limit, offset int, redis *redis.Client) ([]model.User, error)
	UpdateUser(db *gorm.DB, Id uint, data *dto.UpdateUserRequest, redis *redis.Client) error
	DeleteUser(db *gorm.DB, id uint, redis *redis.Client) error
}


// Struct UserService (có thể mở rộng thêm field nếu cần)
type UserService struct {
	repo repository.UserRepositoryInterface
}

// NewUserService - constructor để tạo UserService mới
func NewUserService(ur repository.UserRepositoryInterface) UserServiceInterface {
	return &UserService{
		repo: ur,
	}
}

func (s *UserService) RegisterOTP(db *gorm.DB, userDto *dto.CreateUserRequest, mailer_service *mailer.MailService, redis *redis.Client) (*dto.CreateUserResponseWithOTP, error) {
	email := userDto.Email
	exists, err := s.repo.CheckEmailExists(db, email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, gorm.ErrRegistered
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(userDto.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	code := mailer_service.GenerateOTP()
	time_register := strconv.FormatInt(time.Now().Unix(), 10)
	redis_key_otp := "otp:" + email + time_register
	err = redis.Set(context.Background(), redis_key_otp, code, 5*time.Minute).Err()
	if err != nil {
		return nil, err
	}
	redis_key_pass := "pass:" + email + time_register
	err = redis.Set(context.Background(), redis_key_pass, hashedPassword, 10*time.Hour).Err()
	if err != nil {
		return nil, err
	}
	go func() {
		mailer_service.Send(
			context.Background(),
			&mailer.RegisterEmail{From: "no-reply@myapp.com"},
			email,
			map[string]string{"name": userDto.Name, "otp": code},
		)
	}()

	response := &dto.CreateUserResponseWithOTP{
		Email: userDto.Email,
		Name:  userDto.Name,
		Time:  time_register,
	}
	return response, nil
}

func (s *UserService) Register(db *gorm.DB, userDto *dto.RegisterRequest, mailer_service *mailer.MailService, redis *redis.Client) (*dto.RegisterResponse, error) {
	fmt.Println("test: ", userDto)
	email := userDto.Email

	ok, err := s.repo.CheckEmailExists(db, email)
	if err != nil {
		return nil, err
	}
	if ok {
		return nil, gorm.ErrRegistered
	}
	name := userDto.Name
	time_register := userDto.Time
	redis_key_pass := "pass:" + email + time_register
	var hashedPassword string = ""
	redis_key_otp := "otp:" + email + time_register
	otp, err := redis.Get(context.Background(), redis_key_otp).Result()
	if err != nil {
		return nil, err
	}
	fmt.Println("otp: ", otp)
	if otp != userDto.OTP {
		return nil, gorm.ErrInvalidData
	}
	hashedPassword, err = redis.Get(context.Background(), redis_key_pass).Result()
	if err != nil {
		return nil, err
	}
	err = redis.Del(context.Background(), redis_key_otp).Err()
	if err != nil {
		return nil, err
	}
	err = redis.Del(context.Background(), redis_key_pass).Err()
	if err != nil {
		return nil, err
	}
	newUser := &model.User{
		Name:     name,
		Email:    email,
		Password: hashedPassword,
	}
	err = s.repo.CreateUser(db, newUser)
	if err != nil {
		return nil, err
	}
	tokenPair, err := jwt_utils.GenerateTokenPair(
		newUser.ID,
		newUser.Name,
		newUser.Email,
	)
	if err != nil {
		return nil, err
	}
	userResponse := &dto.UserDTO{
		ID:    newUser.ID,
		Name:  newUser.Name,
		Email: newUser.Email,
	}
	go func() {
		mailer_service.Send(
			context.Background(),
			&mailer.WelcomeEmail{From: "no-reply@myapp.com"},
			email,
			map[string]string{"name": name},
		)
	}()

	response := &dto.RegisterResponse{
		User:      userResponse,
		TokenPair: tokenPair,
	}
	return response, nil
}

func (s *UserService) Login(db *gorm.DB, email, password string) (*dto.LoginResponse, error) {
	user, err := s.repo.GetByEmail(db, email)
	if err != nil {
		return nil, err
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, err
	}

	tokenPair, err := jwt_utils.GenerateTokenPair(
		user.ID,
		user.Name,
		user.Email,
	)
	if err != nil {
		return nil, err
	}
	userResponse := &dto.UserDTO{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	}

	response := &dto.LoginResponse{
		User:      userResponse,
		TokenPair: tokenPair,
	}
	return response, nil
}

func (s *UserService) GetUserByID(db *gorm.DB, id uint) (*model.User, error) {
	return s.repo.GetByID(db, id)
}

func (s *UserService) GetAllUsers(db *gorm.DB, limit, offset int, redis *redis.Client) ([]model.User, error) {
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.GetAllUsers(db, limit, offset)
}

func (s *UserService) UpdateUser(db *gorm.DB, Id uint, data *dto.UpdateUserRequest, redis *redis.Client) error {
	return s.repo.UpdateUser(db, Id, data)
}

func (s *UserService) DeleteUser(db *gorm.DB, id uint, redis *redis.Client) error {

	return s.repo.DeleteUser(db, id)
}
