package jwt_utils

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	AccessTokenSecret  = []byte(os.Getenv("JWT_ACCESS_SECRET"))
	RefreshTokenSecret = []byte(os.Getenv("JWT_REFRESH_SECRET"))
)

type Claims struct {
	Id       uint   `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"` // thời gian hết hạn access token
	TokenType    string `json:"token_type"` // thường "Bearer"
}

func GenerateTokenPair(id uint, username, email string) (*TokenPair, error) {
	// Tạo Access Token
	accessClaims := &Claims{
		Id:       id,
		Username: username,
		Email:    email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(3 * time.Hour)), // Access token hết hạn sau 3 giờ
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "IOT",
			Subject:   fmt.Sprint(id),
		},
	}

	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(AccessTokenSecret)
	if err != nil {
		return nil, err
	}

	refreshClaims := &Claims{
		Id:       id,
		Username: username,
		Email:    email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // Refresh token hết hạn sau 7 ngày
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "IOT",
			Subject:   fmt.Sprint(id),
		},
	}

	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString(RefreshTokenSecret)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    accessClaims.ExpiresAt.Unix(),
		TokenType:    "Bearer",
	}, nil
}

func VerifyToken(tokenString string, isAccessToken bool) (*Claims, error) {
	secret := RefreshTokenSecret
	if isAccessToken {
		secret = AccessTokenSecret
	}
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secret, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}
