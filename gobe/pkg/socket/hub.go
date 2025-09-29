package socket

type DirectMessage struct {
	To      string
	Message []byte
}

type GroupMessage struct {
	GroupID string
	Message []byte
}

type Hub struct {
	Clients     map[*Client]bool
	ClientsByID map[string]*Client
	Groups      map[string]map[*Client]bool

	Broadcast  chan []byte
	Direct     chan DirectMessage
	Group      chan GroupMessage
	Register   chan *Client
	Unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		Clients:     make(map[*Client]bool),
		ClientsByID: make(map[string]*Client),
		Groups:      make(map[string]map[*Client]bool),

		Broadcast:  make(chan []byte),
		Direct:     make(chan DirectMessage),
		Group:      make(chan GroupMessage),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Clients[client] = true
			h.ClientsByID[client.ID] = client

		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				delete(h.ClientsByID, client.ID)
				for group := range client.Groups {
					delete(h.Groups[group], client)
				}
				close(client.Send)
			}

		case message := <-h.Broadcast:
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}

		case dm := <-h.Direct:
			if client, ok := h.ClientsByID[dm.To]; ok {
				client.Send <- dm.Message
			}

		case gm := <-h.Group:
			if members, ok := h.Groups[gm.GroupID]; ok {
				for client := range members {
					client.Send <- gm.Message
				}
			}
		}
	}
}

func (h *Hub) JoinGroup(client *Client, groupID string) {
	if _, ok := h.Groups[groupID]; !ok {
		h.Groups[groupID] = make(map[*Client]bool)
	}
	h.Groups[groupID][client] = true
	client.Groups[groupID] = true
}

func (h *Hub) LeaveGroup(client *Client, groupID string) {
	if _, ok := h.Groups[groupID]; ok {
		delete(h.Groups[groupID], client)
	}
	delete(client.Groups, groupID)
}
