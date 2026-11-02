package chat

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"togethercode/orchestrator/Internal/Configurations"
)

// ChatRepository manages Neon PostgreSQL persistence for in-room chat logs.
type ChatRepository struct {
	pool *pgxpool.Pool
}

var (
	chatRepositoryInstance *ChatRepository
	chatRepositoryOnce     sync.Once
)

// CurrentChatRepository returns the thread-safe lazy singleton ChatRepository.
func CurrentChatRepository() *ChatRepository {
	chatRepositoryOnce.Do(func() {
		cfg := configurations.CurrentApplicationConfig()
		if cfg.NeonDatabaseUrl == "" {
			log.Println("[WARN] NEON_DATABASE_URL is not set; chat repository running in memory mode")
			chatRepositoryInstance = &ChatRepository{pool: nil}
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		poolConfig, err := pgxpool.ParseConfig(cfg.NeonDatabaseUrl)
		if err != nil {
			log.Fatalf("[FATAL] Failed to parse NEON_DATABASE_URL in ChatRepository: %v", err)
		}

		pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
		if err != nil {
			log.Fatalf("[FATAL] Failed to connect to Neon PostgreSQL in ChatRepository: %v", err)
		}

		chatRepositoryInstance = &ChatRepository{pool: pool}
	})

	return chatRepositoryInstance
}

// SaveChatMessage asynchronously stores a message in Neon PostgreSQL.
func (r *ChatRepository) SaveChatMessage(ctx context.Context, roomID string, senderName string, senderRole string, content string) error {
	if r.pool == nil {
		return nil
	}

	msgID := generateChatUUID()
	query := `
		INSERT INTO chat_messages (id, room_id, sender_name, sender_role, content, sent_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`
	_, err := r.pool.Exec(ctx, query, msgID, roomID, senderName, senderRole, content)
	if err != nil {
		return fmt.Errorf("failed to insert chat message: %w", err)
	}
	return nil
}

func generateChatUUID() string {
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", bytes[0:4], bytes[4:6], bytes[6:8], bytes[8:10], bytes[10:])
}
