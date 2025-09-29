package mymqtt

import (
	"fmt"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

func Subscribe(client mqtt.Client, topic string, qos byte, handler mqtt.MessageHandler) error {
	if client == nil {
		return fmt.Errorf("MQTT client is nil")
	}

	token := client.Subscribe(topic, qos, handler)
	token.Wait()
	return token.Error()
}

func Publish(client mqtt.Client, topic string, qos byte, retained bool, payload interface{}) error {
	if client == nil {
		return fmt.Errorf("MQTT client is nil")
	}

	token := client.Publish(topic, qos, retained, payload)
	token.Wait()
	return token.Error()
}

func Disconnect(client mqtt.Client) {
	if client != nil {
		client.Disconnect(1000)
		fmt.Println("MQTT Disconnected")
	}
}
