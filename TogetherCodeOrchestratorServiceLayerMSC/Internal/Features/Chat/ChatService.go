package chat

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Client represents an active WebSocket connection attached to a specific room.
type Client struct {
	Hub         *ChatService
	Conn        *websocket.Conn
	Send        chan *WebSocketMessage
	RoomCode    string
	DisplayName string
	Role        string
}

// ChatService coordinates WebSocket client lifecycles and real-time message routing per room.
type ChatService struct {
	repo       *ChatRepository
	clients    map[string]map[*Client]bool // Keyed by RoomCode
	mutex      sync.RWMutex
	register   chan *Client
	unregister chan *Client
	broadcast  chan *WebSocketMessage
}

var (
	chatServiceInstance *ChatService
	chatServiceOnce     sync.Once
)

// CurrentChatService returns the thread-safe lazy singleton ChatService and starts the hub loop.
func CurrentChatService() *ChatService {
	chatServiceOnce.Do(func() {
		service := &ChatService{
			repo:       CurrentChatRepository(),
			clients:    make(map[string]map[*Client]bool),
			register:   make(chan *Client),
			unregister: make(chan *Client),
			broadcast:  make(chan *WebSocketMessage, MESSAGE_BUFFER_CAPACITY),
		}

		go service.runHubLoop()
		chatServiceInstance = service
	})

	return chatServiceInstance
}

func (s *ChatService) runHubLoop() {
	for {
		select {
		case client := <-s.register:
			s.mutex.Lock()
			if _, exists := s.clients[client.RoomCode]; !exists {
				s.clients[client.RoomCode] = make(map[*Client]bool)
			}
			s.clients[client.RoomCode][client] = true
			s.mutex.Unlock()

			// Broadcast presence join notification to the room
			s.BroadcastToRoom(&WebSocketMessage{
				Type:       MESSAGE_TYPE_PRESENCE,
				RoomCode:   client.RoomCode,
				SenderName: client.DisplayName,
				SenderRole: client.Role,
				Payload:    fmt.Sprintf("%s joined the session", client.DisplayName),
				Timestamp:  time.Now().UnixMilli(),
			})

		case client := <-s.unregister:
			s.mutex.Lock()
			if roomClients, exists := s.clients[client.RoomCode]; exists {
				if _, ok := roomClients[client]; ok {
					delete(roomClients, client)
					close(client.Send)
					if len(roomClients) == 0 {
						delete(s.clients, client.RoomCode)
					}
				}
			}
			s.mutex.Unlock()

			// Broadcast presence departure notification to the room
			s.BroadcastToRoom(&WebSocketMessage{
				Type:       MESSAGE_TYPE_DISCONNECT,
				RoomCode:   client.RoomCode,
				SenderName: client.DisplayName,
				SenderRole: client.Role,
				Payload:    fmt.Sprintf("%s left the session", client.DisplayName),
				Timestamp:  time.Now().UnixMilli(),
			})

		case msg := <-s.broadcast:
			s.mutex.RLock()
			roomClients, exists := s.clients[msg.RoomCode]
			s.mutex.RUnlock()

			if exists {
				for client := range roomClients {
					select {
					case client.Send <- msg:
					default:
						// Buffer full; remove unresponsive client
						close(client.Send)
						delete(roomClients, client)
					}
				}
			}

			// Asynchronously persist chat messages to Neon PostgreSQL
			if msg.Type == MESSAGE_TYPE_CHAT {
				go func(m *WebSocketMessage) {
					ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
					defer cancel()
					if err := s.repo.SaveChatMessage(ctx, m.RoomCode, m.SenderName, m.SenderRole, m.Payload); err != nil {
						log.Printf("[WARN] Failed to persist chat message: %v\n", err)
					}
				}(msg)
			}
		}
	}
}

// BroadcastToRoom dispatches a message into the hub broadcast pipeline.
func (s *ChatService) BroadcastToRoom(msg *WebSocketMessage) {
	s.broadcast <- msg
}

// RegisterClient adds a client to the hub.
func (s *ChatService) RegisterClient(client *Client) {
	s.register <- client
}

// UnregisterClient removes a client from the hub.
func (s *ChatService) UnregisterClient(client *Client) {
	s.unregister <- client
}

// ReadPump handles incoming WebSocket frames from a client.
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.UnregisterClient(c)
		_ = c.Conn.Close()
	}()

	c.Conn.SetReadLimit(4096)
	_ = c.Conn.SetReadDeadline(time.Now().Add(READ_WAIT_SECONDS * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(READ_WAIT_SECONDS * time.Second))
		return nil
	})

	for {
		var msg WebSocketMessage
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[INFO] WebSocket closed for %s: %v\n", c.DisplayName, err)
			}
			break
		}

		// Enforce client metadata
		msg.RoomCode = c.RoomCode
		msg.SenderName = c.DisplayName
		msg.SenderRole = c.Role
		msg.Timestamp = time.Now().UnixMilli()

		c.Hub.BroadcastToRoom(&msg)
	}
}

// WritePump pushes outgoing messages from the hub to the client's WebSocket connection.
func (c *Client) WritePump() {
	ticker := time.NewTicker(HEARTBEAT_INTERVAL_SECONDS * time.Second)
	defer func() {
		ticker.Stop()
		_ = c.Conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.Send:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(WRITE_WAIT_SECONDS * time.Second))
			if !ok {
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteJSON(msg); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(WRITE_WAIT_SECONDS * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
