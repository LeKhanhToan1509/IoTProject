package config

type MQTTConfig struct {
	Broker       string
	ClientID     string
	Username     string
	Password     string
	DefaultTopic string
	QoS          byte 
}

