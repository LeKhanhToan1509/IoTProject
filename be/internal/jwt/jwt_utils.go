package jwt

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	// JWT Secret key - in production, this should be from environment variable
	jwtSecret = []byte("your-secret-key-change-this-in-production-make-it-very-long-and-secure")

	// Token expiration times
	AccessTokenExpiry  = time.Hour * 24     // 24 hours
	RefreshTokenExpiry = time.Hour * 24 * 7 // 7 days
)

// Header represents JWT header
type Header struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
}

// Claims represents the JWT claims
type Claims struct {
	UserID    uint   `json:"user_id"`
	Email     string `json:"email"`
	Role      string `json:"role,omitempty"`
	ExpiresAt int64  `json:"exp"`
	IssuedAt  int64  `json:"iat"`
	NotBefore int64  `json:"nbf"`
	Issuer    string `json:"iss"`
	Subject   string `json:"sub"`
	ID        string `json:"jti"`
}

// TokenPair represents access and refresh tokens
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"`
	TokenType    string `json:"token_type"`
}

// GenerateTokenPair generates both access and refresh tokens
func GenerateTokenPair(userID uint, email string) (*TokenPair, error) {
	// Generate access token
	accessToken, accessExpiresAt, err := GenerateAccessToken(userID, email)
	if err != nil {
		return nil, err
	}

	// Generate refresh token
	refreshToken, _, err := GenerateRefreshToken(userID, email)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    accessExpiresAt.Unix(),
		TokenType:    "Bearer",
	}, nil
}

// GenerateAccessToken generates a new access token
func GenerateAccessToken(userID uint, email string) (string, time.Time, error) {
	expiresAt := time.Now().Add(AccessTokenExpiry)

	claims := &Claims{
		UserID:    userID,
		Email:     email,
		ExpiresAt: expiresAt.Unix(),
		IssuedAt:  time.Now().Unix(),
		NotBefore: time.Now().Unix(),
		Issuer:    "iot-api",
		Subject:   email,
		ID:        generateJTI(),
	}

	token, err := createToken(claims)
	if err != nil {
		return "", time.Time{}, err
	}

	return token, expiresAt, nil
}

// GenerateRefreshToken generates a new refresh token
func GenerateRefreshToken(userID uint, email string) (string, time.Time, error) {
	expiresAt := time.Now().Add(RefreshTokenExpiry)

	claims := &Claims{
		UserID:    userID,
		Email:     email,
		ExpiresAt: expiresAt.Unix(),
		IssuedAt:  time.Now().Unix(),
		NotBefore: time.Now().Unix(),
		Issuer:    "iot-api-refresh",
		Subject:   email,
		ID:        generateJTI(),
	}

	token, err := createToken(claims)
	if err != nil {
		return "", time.Time{}, err
	}

	return token, expiresAt, nil
}

// createToken creates a JWT token with the given claims
func createToken(claims *Claims) (string, error) {
	header := Header{
		Alg: "HS256",
		Typ: "JWT",
	}

	// Encode header
	headerBytes, err := json.Marshal(header)
	if err != nil {
		return "", err
	}
	headerEncoded := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(headerBytes)

	// Encode payload
	payloadBytes, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	payloadEncoded := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(payloadBytes)

	// Create signature
	data := headerEncoded + "." + payloadEncoded
	signature := createSignature(data)

	return data + "." + signature, nil
}

// createSignature creates HMAC-SHA256 signature
func createSignature(data string) string {
	h := hmac.New(sha256.New, jwtSecret)
	h.Write([]byte(data))
	return base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(h.Sum(nil))
}

// ValidateToken validates a JWT token and returns the claims
func ValidateToken(tokenString string) (*Claims, error) {
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid token format")
	}

	headerEncoded, payloadEncoded, signature := parts[0], parts[1], parts[2]

	// Verify signature
	data := headerEncoded + "." + payloadEncoded
	expectedSignature := createSignature(data)
	if signature != expectedSignature {
		return nil, errors.New("invalid token signature")
	}

	// Decode payload
	payloadBytes, err := base64.URLEncoding.WithPadding(base64.NoPadding).DecodeString(payloadEncoded)
	if err != nil {
		return nil, errors.New("invalid token payload encoding")
	}

	var claims Claims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, errors.New("invalid token payload")
	}

	// Check expiration
	if time.Now().Unix() > claims.ExpiresAt {
		return nil, errors.New("token expired")
	}

	// Check not before
	if time.Now().Unix() < claims.NotBefore {
		return nil, errors.New("token not yet valid")
	}

	return &claims, nil
}

// ExtractTokenFromHeader extracts JWT token from Authorization header
func ExtractTokenFromHeader(authHeader string) (string, error) {
	if authHeader == "" {
		return "", errors.New("authorization header is required")
	}

	// Expected format: "Bearer <token>"
	const bearerPrefix = "Bearer "
	if len(authHeader) < len(bearerPrefix) || authHeader[:len(bearerPrefix)] != bearerPrefix {
		return "", errors.New("invalid authorization header format")
	}

	return authHeader[len(bearerPrefix):], nil
}

// RefreshAccessToken generates a new access token from a valid refresh token
func RefreshAccessToken(refreshTokenString string) (*TokenPair, error) {
	// Validate refresh token
	claims, err := ValidateToken(refreshTokenString)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	// Check if it's actually a refresh token
	if claims.Issuer != "iot-api-refresh" {
		return nil, errors.New("not a refresh token")
	}

	// Generate new token pair
	return GenerateTokenPair(claims.UserID, claims.Email)
}

// IsTokenExpired checks if a token is expired
func IsTokenExpired(tokenString string) bool {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return true
	}

	return time.Now().Unix() > claims.ExpiresAt
}

// generateJTI generates a unique token ID
func generateJTI() string {
	return fmt.Sprintf("%d-%s", time.Now().UnixNano(), generateRandomString(8))
}

// generateRandomString generates a random string of specified length
func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[int(time.Now().UnixNano()+int64(i))%len(charset)]
	}
	return string(b)
}

// SetJWTSecret sets the JWT secret key (for configuration)
func SetJWTSecret(secret string) {
	if len(secret) < 32 {
		panic("JWT secret must be at least 32 characters long")
	}
	jwtSecret = []byte(secret)
}

// SetTokenExpiry sets token expiration times
func SetTokenExpiry(accessExpiry, refreshExpiry time.Duration) {
	AccessTokenExpiry = accessExpiry
	RefreshTokenExpiry = refreshExpiry
}

// GetClaimsFromToken extracts claims without validation (for debugging)
func GetClaimsFromToken(tokenString string) (*Claims, error) {
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid token format")
	}

	payloadBytes, err := base64.URLEncoding.WithPadding(base64.NoPadding).DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("invalid token payload encoding")
	}

	var claims Claims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, errors.New("invalid token payload")
	}

	return &claims, nil
}
