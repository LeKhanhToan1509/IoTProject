package socket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type MessageType string

const (
	BroadcastMsg MessageType = "broadcast"
	DirectMsg    MessageType = "direct"
	GroupMsg     MessageType = "group"
	JoinGroupMsg MessageType = "join_group"
	LeaveGroupMsg MessageType = "leave_group"
)

type ClientMessage struct {
	Type     MessageType `json:"type"`
	Content  string      `json:"content,omitempty"`
	To       string      `json:"to,omitempty"`
	GroupID  string      `json:"groupId,omitempty"`
}

type Client struct {
	ID     string
	Hub    *Hub
	Conn   *websocket.Conn
	Send   chan []byte
	Groups map[string]bool
}

func NewClient(hub *Hub, conn *websocket.Conn) *Client {
	return &Client{
		ID:     uuid.NewString(),
		Hub:    hub,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		Groups: make(map[string]bool),
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		
		// Try to parse as JSON message
		var clientMsg ClientMessage
		if err := json.Unmarshal(message, &clientMsg); err != nil {
			// If not JSON, treat as plain broadcast message
			c.Hub.Broadcast <- message
			continue
		}
		
		// Handle different message types
		switch clientMsg.Type {
		case BroadcastMsg:
			c.Hub.Broadcast <- []byte(clientMsg.Content)
		case DirectMsg:
			if clientMsg.To != "" {
				c.Hub.Direct <- DirectMessage{
					To:      clientMsg.To,
					Message: []byte(clientMsg.Content),
				}
			}
		case GroupMsg:
			if clientMsg.GroupID != "" {
				c.Hub.Group <- GroupMessage{
					GroupID: clientMsg.GroupID,
					Message: []byte(clientMsg.Content),
				}
			}
		case JoinGroupMsg:
			if clientMsg.GroupID != "" {
				c.Hub.JoinGroup(c, clientMsg.GroupID)
				log.Printf("Client %s joined group %s", c.ID, clientMsg.GroupID)
			}
		case LeaveGroupMsg:
			if clientMsg.GroupID != "" {
				c.Hub.LeaveGroup(c, clientMsg.GroupID)
				log.Printf("Client %s left group %s", c.ID, clientMsg.GroupID)
			}
		default:
			// Unknown message type, broadcast as plain text
			c.Hub.Broadcast <- message
		}
	}
}

func (c *Client) WritePump() {
	defer c.Conn.Close()
	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.Conn.WriteMessage(websocket.TextMessage, message)

		case <-time.After(30 * time.Minute):
			c.Conn.WriteMessage(websocket.CloseMessage, []byte("timeout"))
			return
		}
	}
}
