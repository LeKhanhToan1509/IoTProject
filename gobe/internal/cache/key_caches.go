package cache

type KeyCache struct {
	key map[string]string
}

// Khởi tạo KeyCache với các key mặc định
func NewKeyCache() *KeyCache {
	return &KeyCache{
		key: map[string]string{
			"GetAllUser": "user:all",
			"OTP":        "otp",  // prefix
			"Pass":       "pass", // prefix
			"Name":       "name", // prefix
		},
	}
}

func (k *KeyCache) Get(keyName string) string {
	if val, ok := k.key[keyName]; ok {
		return val
	}
	return ""
}

func (k *KeyCache) GetWithSuffix(keyName, suffix string) string {
	if val, ok := k.key[keyName]; ok {
		return val + ":" + suffix
	}
	return ""
}

func (k *KeyCache) GetWithTwoSuffix(keyName, suffix1, suffix2 string) string {
	if val, ok := k.key[keyName]; ok {
		return val + ":" + suffix1 + ":" + suffix2
	}
	return ""
}
