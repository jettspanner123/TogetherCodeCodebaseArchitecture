package room

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
	"togethercode/orchestrator/Internal/Features/Container"
)

var (
	ErrRoomNotFound         = errors.New("room not found")
	ErrRoomFull             = errors.New("room has reached maximum capacity")
	ErrInvalidPassword      = errors.New("invalid room password")
	ErrRoomEnded            = errors.New("room session has ended")
	ErrInternalServerFailure = errors.New("internal server error")
)

// RoomService handles in-memory and database-backed room lifecycle management.
type RoomService struct {
	repo        *RoomRepository
	mutex       sync.RWMutex
	activeRooms map[string]*RoomEntity // Keyed by room code
}

var (
	roomServiceInstance *RoomService
	roomServiceOnce     sync.Once
)

// CurrentRoomService returns the thread-safe lazy singleton RoomService.
func CurrentRoomService() *RoomService {
	roomServiceOnce.Do(func() {
		roomServiceInstance = &RoomService{
			repo:        CurrentRoomRepository(),
			activeRooms: make(map[string]*RoomEntity),
		}
	})
	return roomServiceInstance
}

// CreateRoom generates a new room session, hashes password, registers in memory, and persists to Neon.
func (s *RoomService) CreateRoom(ctx context.Context, req *CreateRoomRequestDTO) (*RoomResponseDTO, error) {
	code, err := s.generateUniqueRoomCode()
	if err != nil {
		return nil, fmt.Errorf("failed to generate unique room code: %w", err)
	}

	roomID := generateUUID()
	now := time.Now()

	var passwordHash *string
	if req.Password != "" {
		hashBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), BCRYPT_COST)
		if err != nil {
			return nil, fmt.Errorf("failed to hash room password: %w", err)
		}
		hashStr := string(hashBytes)
		passwordHash = &hashStr
	}

	creatorToken := generateSecureToken()
	creatorParticipant := ParticipantEntity{
		ID:           generateUUID(),
		RoomID:       roomID,
		DisplayName:  strings.TrimSpace(req.CreatorName),
		Role:         ROLE_USER_ONE,
		SessionToken: creatorToken,
		JoinedAt:     now,
	}

	roomEntity := &RoomEntity{
		ID:             roomID,
		Code:           code,
		PasswordHash:   passwordHash,
		Status:         ROOM_STATUS_ACTIVE,
		CreatedAt:      now,
		Participants:   []ParticipantEntity{creatorParticipant},
		LastActivityAt: now,
	}

	// Register in-memory for sub-millisecond lookup
	s.mutex.Lock()
	s.activeRooms[code] = roomEntity
	s.mutex.Unlock()

	// Initialize workspace starter files and spawn container
	go func() {
		spawnCtx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()
		if _, err := container.CurrentContainerService().SpawnContainer(spawnCtx, code); err != nil {
			fmt.Printf("[ERROR] Failed to spawn container for room %s: %v\n", code, err)
		}
	}()

	// Asynchronously persist to Neon PostgreSQL
	go func() {
		dbCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := s.repo.SaveRoom(dbCtx, roomEntity); err != nil {
			fmt.Printf("[ERROR] Failed to save room to Neon DB: %v\n", err)
		}
		if err := s.repo.AddParticipant(dbCtx, &creatorParticipant); err != nil {
			fmt.Printf("[ERROR] Failed to save participant to Neon DB: %v\n", err)
		}
	}()

	response := &RoomResponseDTO{
		ID:           roomEntity.ID,
		Code:         roomEntity.Code,
		Status:       roomEntity.Status,
		HasPassword:  roomEntity.PasswordHash != nil,
		SessionToken: creatorToken,
		AssignedRole: ROLE_USER_ONE,
		CreatedAt:    roomEntity.CreatedAt,
		Participants: []ParticipantDTO{
			{
				ID:          creatorParticipant.ID,
				DisplayName: creatorParticipant.DisplayName,
				Role:        creatorParticipant.Role,
				JoinedAt:    creatorParticipant.JoinedAt,
			},
		},
	}

	return response, nil
}

// JoinRoom validates credentials, strictly limits participants to 2, and assigns UserTwo.
func (s *RoomService) JoinRoom(ctx context.Context, code string, req *JoinRoomRequestDTO) (*RoomResponseDTO, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	room, exists := s.activeRooms[code]
	if !exists {
		return nil, ErrRoomNotFound
	}

	if room.Status != ROOM_STATUS_ACTIVE {
		return nil, ErrRoomEnded
	}

	// Verify room password if set
	if room.PasswordHash != nil {
		if req.Password == "" {
			return nil, ErrInvalidPassword
		}
		if err := bcrypt.CompareHashAndPassword([]byte(*room.PasswordHash), []byte(req.Password)); err != nil {
			return nil, ErrInvalidPassword
		}
	}

	// Strict 1:1 capacity check
	if len(room.Participants) >= MAX_ROOM_CAPACITY {
		return nil, ErrRoomFull
	}

	joinerToken := generateSecureToken()
	joinerParticipant := ParticipantEntity{
		ID:           generateUUID(),
		RoomID:       room.ID,
		DisplayName:  strings.TrimSpace(req.DisplayName),
		Role:         ROLE_USER_TWO,
		SessionToken: joinerToken,
		JoinedAt:     time.Now(),
	}

	room.Participants = append(room.Participants, joinerParticipant)
	room.LastActivityAt = time.Now()

	// Persist participant to Neon PostgreSQL
	go func() {
		dbCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := s.repo.AddParticipant(dbCtx, &joinerParticipant); err != nil {
			fmt.Printf("[ERROR] Failed to save participant to Neon DB: %v\n", err)
		}
	}()

	var participantDTOs []ParticipantDTO
	for _, p := range room.Participants {
		participantDTOs = append(participantDTOs, ParticipantDTO{
			ID:          p.ID,
			DisplayName: p.DisplayName,
			Role:        p.Role,
			JoinedAt:    p.JoinedAt,
		})
	}

	return &RoomResponseDTO{
		ID:           room.ID,
		Code:         room.Code,
		Status:       room.Status,
		HasPassword:  room.PasswordHash != nil,
		SessionToken: joinerToken,
		AssignedRole: ROLE_USER_TWO,
		CreatedAt:    room.CreatedAt,
		Participants: participantDTOs,
	}, nil
}

// GetRoomByCode retrieves public room details and participant state.
func (s *RoomService) GetRoomByCode(ctx context.Context, code string) (*RoomResponseDTO, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	room, exists := s.activeRooms[code]
	if !exists {
		return nil, ErrRoomNotFound
	}

	var participantDTOs []ParticipantDTO
	for _, p := range room.Participants {
		participantDTOs = append(participantDTOs, ParticipantDTO{
			ID:          p.ID,
			DisplayName: p.DisplayName,
			Role:        p.Role,
			JoinedAt:    p.JoinedAt,
		})
	}

	return &RoomResponseDTO{
		ID:           room.ID,
		Code:         room.Code,
		Status:       room.Status,
		HasPassword:  room.PasswordHash != nil,
		CreatedAt:    room.CreatedAt,
		Participants: participantDTOs,
	}, nil
}

func (s *RoomService) generateUniqueRoomCode() (string, error) {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	for attempts := 0; attempts < 10; attempts++ {
		codeBytes := make([]byte, ROOM_CODE_LENGTH)
		for i := 0; i < ROOM_CODE_LENGTH; i++ {
			num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
			if err != nil {
				return "", err
			}
			codeBytes[i] = charset[num.Int64()]
		}
		code := fmt.Sprintf("TC-%s", string(codeBytes))

		s.mutex.RLock()
		_, exists := s.activeRooms[code]
		s.mutex.RUnlock()

		if !exists {
			return code, nil
		}
	}
	return "", errors.New("failed to generate unique room code")
}

func generateSecureToken() string {
	bytes := make([]byte, 32)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func generateUUID() string {
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", bytes[0:4], bytes[4:6], bytes[6:8], bytes[8:10], bytes[10:])
}
