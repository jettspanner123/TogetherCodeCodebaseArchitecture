package room

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"togethercode/orchestrator/Internal/Configurations"
)

// RoomRepository handles database persistence for rooms and participants via pgxpool.
type RoomRepository struct {
	pool *pgxpool.Pool
}

var (
	roomRepositoryInstance *RoomRepository
	roomRepositoryOnce     sync.Once
)

// CurrentRoomRepository returns the thread-safe lazy singleton RoomRepository.
func CurrentRoomRepository() *RoomRepository {
	roomRepositoryOnce.Do(func() {
		cfg := configurations.CurrentApplicationConfig()
		if cfg.NeonDatabaseUrl == "" {
			log.Println("[WARN] NEON_DATABASE_URL is not set; database repository running in mock mode")
			roomRepositoryInstance = &RoomRepository{pool: nil}
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		poolConfig, err := pgxpool.ParseConfig(cfg.NeonDatabaseUrl)
		if err != nil {
			log.Fatalf("[FATAL] Failed to parse NEON_DATABASE_URL: %v", err)
		}

		poolConfig.MaxConns = 10
		poolConfig.MinConns = 2

		pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
		if err != nil {
			log.Fatalf("[FATAL] Failed to connect to Neon PostgreSQL: %v", err)
		}

		if err := pool.Ping(ctx); err != nil {
			log.Fatalf("[FATAL] Failed to ping Neon PostgreSQL: %v", err)
		}

		log.Println("[INFO] Successfully connected to Neon Serverless PostgreSQL")
		repo := &RoomRepository{pool: pool}
		if err := repo.MigrateSchema(ctx); err != nil {
			log.Fatalf("[FATAL] Failed to execute Neon database migration: %v", err)
		}

		roomRepositoryInstance = repo
	})

	return roomRepositoryInstance
}

// MigrateSchema executes the DDL schema ensuring all required tables exist in Neon.
func (r *RoomRepository) MigrateSchema(ctx context.Context) error {
	if r.pool == nil {
		return nil
	}

	query := `
	CREATE TABLE IF NOT EXISTS rooms (
		id VARCHAR(36) PRIMARY KEY,
		code VARCHAR(16) UNIQUE NOT NULL,
		password_hash VARCHAR(255),
		status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
		container_id VARCHAR(128),
		container_port INT,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		ended_at TIMESTAMP WITH TIME ZONE
	);

	CREATE TABLE IF NOT EXISTS room_participants (
		id VARCHAR(36) PRIMARY KEY,
		room_id VARCHAR(36) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
		display_name VARCHAR(64) NOT NULL,
		role VARCHAR(16) NOT NULL,
		session_token VARCHAR(255) NOT NULL,
		joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		left_at TIMESTAMP WITH TIME ZONE
	);

	CREATE TABLE IF NOT EXISTS chat_messages (
		id VARCHAR(36) PRIMARY KEY,
		room_id VARCHAR(36) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
		sender_name VARCHAR(64) NOT NULL,
		sender_role VARCHAR(16) NOT NULL,
		content TEXT NOT NULL,
		sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS session_logs (
		id BIGSERIAL PRIMARY KEY,
		room_id VARCHAR(36) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
		event_type VARCHAR(64) NOT NULL,
		event_payload JSONB,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
	CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
	CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
	`

	_, err := r.pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("schema migration failed: %w", err)
	}

	log.Println("[INFO] Neon database tables migrated successfully")
	return nil
}

// SaveRoom writes a new room entity to Neon PostgreSQL.
func (r *RoomRepository) SaveRoom(ctx context.Context, room *RoomEntity) error {
	if r.pool == nil {
		return nil
	}

	query := `
		INSERT INTO rooms (id, code, password_hash, status, container_id, container_port, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.pool.Exec(ctx, query,
		room.ID,
		room.Code,
		room.PasswordHash,
		room.Status,
		room.ContainerID,
		room.ContainerPort,
		room.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert room into database: %w", err)
	}
	return nil
}

// AddParticipant records a participant joining a room.
func (r *RoomRepository) AddParticipant(ctx context.Context, p *ParticipantEntity) error {
	if r.pool == nil {
		return nil
	}

	query := `
		INSERT INTO room_participants (id, room_id, display_name, role, session_token, joined_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := r.pool.Exec(ctx, query,
		p.ID,
		p.RoomID,
		p.DisplayName,
		p.Role,
		p.SessionToken,
		p.JoinedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert participant: %w", err)
	}
	return nil
}

// UpdateRoomStatus updates the room lifecycle status.
func (r *RoomRepository) UpdateRoomStatus(ctx context.Context, roomID string, status string) error {
	if r.pool == nil {
		return nil
	}

	query := `UPDATE rooms SET status = $1, ended_at = $2 WHERE id = $3`
	var endedAt *time.Time
	if status == ROOM_STATUS_ENDED || status == ROOM_STATUS_EXPIRED {
		now := time.Now()
		endedAt = &now
	}

	_, err := r.pool.Exec(ctx, query, status, endedAt, roomID)
	if err != nil {
		return fmt.Errorf("failed to update room status: %w", err)
	}
	return nil
}
