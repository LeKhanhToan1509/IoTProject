package initialize

import (
	"fmt"
	"iot/pkg/config"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

func InitMqtt() (mqtt.Client, error) {
	MqttConfig := config.GetConfig().MQTTConfig
	if MqttConfig == nil {
		return nil, fmt.Errorf("MQTT configuration is missing")
	}
	opts := mqtt.NewClientOptions()
	opts.AddBroker(MqttConfig.Broker)
	opts.SetClientID(MqttConfig.ClientID)
	opts.SetUsername(MqttConfig.Username)
	opts.SetPassword(MqttConfig.Password)

	client := mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		return nil, token.Error()
	}

	return client, nil
}
