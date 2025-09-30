package brigde

import (
	"context"
	"fmt"
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

func (b *Bridge) GetSensorData(ctx context.Context) {
	if !b.mqtt.IsConnected() {
		return
	}

	topic := "sensor/information"

	// subscribe
	token := b.mqtt.Subscribe(topic, 0, func(client mqtt.Client, msg mqtt.Message) {
		b.socketHub.Broadcast <- msg.Payload()
		fmt.Println(msg.Topic(), string(msg.Payload()))
		fmt.Printf("type of payload: %T\n", msg.Payload())

	})
	token.Wait()
	if token.Error() != nil {
		fmt.Printf("Failed to subscribe: %v\n", token.Error())
		return
	}
	fmt.Printf("Subscribed to topic: %s\n", topic)

	<-ctx.Done()

	if unsub := b.mqtt.Unsubscribe(topic); unsub.Wait() && unsub.Error() != nil {
		fmt.Printf("Failed to unsubscribe: %v\n", unsub.Error())
	} else {
		fmt.Printf("Unsubscribed from topic: %s\n", topic)
	}
}
