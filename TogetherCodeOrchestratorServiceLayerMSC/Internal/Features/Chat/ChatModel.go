package chat

import "time"

// WebSocketMessage represents the standardized frame sent and received over WebSockets.
type WebSocketMessage struct {
	Type        string `json:"type"`                  // CONNECT, DISCONNECT, PRESENCE, TYPING, CHAT, SCRATCHPAD
	RoomCode    string `json:"roomCode"`
	SenderName  string `json:"senderName"`
	SenderRole  string `json:"senderRole"`            // UserOne, UserTwo
	Payload     string `json:"payload,omitempty"`     // Chat text or collaborative scratchpad notes
	IsTyping    bool   `json:"isTyping,omitempty"`    // Typing pulse indicator
	Timestamp   int64  `json:"timestamp"`
}

// ChatMessageEntity represents the database record persisted in Neon PostgreSQL.
type ChatMessageEntity struct {
	ID         string
	RoomID     string
	SenderName string
	SenderRole string
	Content    string
	SentAt     time.Time
}

// PresenceStatusDTO represents the online status of a participant in a room.
type PresenceStatusDTO struct {
	Role        string `json:"role"`
	DisplayName string `json:"displayName"`
	IsOnline    bool   `json:"isOnline"`
	IsTyping    bool   `json:"isTyping"`
}
