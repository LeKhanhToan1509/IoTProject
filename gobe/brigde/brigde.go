package brigde

import (
	"iot/pkg/socket"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

type Bridge struct {
	mqtt      mqtt.Client
	socketHub *socket.Hub
}

func NewBridge(mqttClient mqtt.Client, socketHub *socket.Hub) *Bridge {
	return &Bridge{
		mqtt:      mqttClient,
		socketHub: socketHub,
	}
}

func (b *Bridge) GetSensorData() {
	topic := "sensors/information"
	b.mqtt.Subscribe(topic, 0, func(client mqtt.Client, msg mqtt.Message) {
		b.socketHub.Broadcast <- msg.Payload()
	})
}
