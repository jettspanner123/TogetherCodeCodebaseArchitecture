package room

import (
	"strings"
	"time"
)

// ValidationError represents field-level validation errors.
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// CreateRoomRequestDTO defines the payload required to create a new coding session room.
type CreateRoomRequestDTO struct {
	CreatorName string `json:"creatorName" binding:"required,min=2,max=32"`
	Password    string `json:"password" binding:"omitempty,min=4,max=64"`
}

// Validate executes custom domain rules for CreateRoomRequestDTO.
func (dto *CreateRoomRequestDTO) Validate() []ValidationError {
	var errors []ValidationError
	trimmedName := strings.TrimSpace(dto.CreatorName)
	if len(trimmedName) < 2 {
		errors = append(errors, ValidationError{
			Field:   "creatorName",
			Message: "Creator name must contain at least 2 non-whitespace characters",
		})
	}
	if dto.Password != "" && len(strings.TrimSpace(dto.Password)) < 4 {
		errors = append(errors, ValidationError{
			Field:   "password",
			Message: "Password must be at least 4 characters long if provided",
		})
	}
	return errors
}

// JoinRoomRequestDTO defines the payload required for a peer to join an active room.
type JoinRoomRequestDTO struct {
	DisplayName string `json:"displayName" binding:"required,min=2,max=32"`
	Password    string `json:"password" binding:"omitempty"`
}

// Validate executes custom domain rules for JoinRoomRequestDTO.
func (dto *JoinRoomRequestDTO) Validate() []ValidationError {
	var errors []ValidationError
	trimmedName := strings.TrimSpace(dto.DisplayName)
	if len(trimmedName) < 2 {
		errors = append(errors, ValidationError{
			Field:   "displayName",
			Message: "Display name must contain at least 2 non-whitespace characters",
		})
	}
	return errors
}

// ParticipantDTO represents public information about an active room participant.
type ParticipantDTO struct {
	ID          string    `json:"id"`
	DisplayName string    `json:"displayName"`
	Role        string    `json:"role"`
	JoinedAt    time.Time `json:"joinedAt"`
}

// RoomResponseDTO represents the comprehensive response payload for a room session.
type RoomResponseDTO struct {
	ID           string           `json:"id"`
	Code         string           `json:"code"`
	Status       string           `json:"status"`
	HasPassword  bool             `json:"hasPassword"`
	Participants []ParticipantDTO `json:"participants"`
	SessionToken string           `json:"sessionToken,omitempty"`
	AssignedRole string           `json:"assignedRole,omitempty"`
	CreatedAt    time.Time        `json:"createdAt"`
}

// RoomEntity represents the internal database and in-memory representation of a room.
type RoomEntity struct {
	ID             string
	Code           string
	PasswordHash   *string
	Status         string
	ContainerID    *string
	ContainerPort  *int
	CreatedAt      time.Time
	EndedAt        *time.Time
	Participants   []ParticipantEntity
	LastActivityAt time.Time
}

// ParticipantEntity represents a user inside a room session.
type ParticipantEntity struct {
	ID           string
	RoomID       string
	DisplayName  string
	Role         string
	SessionToken string
	JoinedAt     time.Time
	LeftAt       *time.Time
}
