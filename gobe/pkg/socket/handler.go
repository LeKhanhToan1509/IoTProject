package socket

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	client := NewClient(hub, conn)
	hub.Register <- client

	// Send client ID to the new client
	welcomeMsg := map[string]string{
		"type":      "welcome",
		"client_id": client.ID,
		"message":   "Connected successfully",
	}
	if welcomeBytes, err := json.Marshal(welcomeMsg); err == nil {
		client.Send <- welcomeBytes
	}

	go client.WritePump()
	go client.ReadPump()
}
