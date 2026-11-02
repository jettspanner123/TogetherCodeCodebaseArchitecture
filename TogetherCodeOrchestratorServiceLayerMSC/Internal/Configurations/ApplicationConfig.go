package configurations

import (
	"log"
	"os"
	"strconv"
	"sync"

	"github.com/joho/godotenv"
)

// ApplicationConfig holds all environment configurations for the orchestrator service.
type ApplicationConfig struct {
	Port                   string
	GinMode                string
	ClientOrigin           string
	NeonDatabaseUrl        string
	DockerHost             string
	OpenVSCodeImage        string
	RoomIdleTimeoutMinutes int
}

var (
	configInstance *ApplicationConfig
	configOnce     sync.Once
)

// CurrentApplicationConfig returns the thread-safe lazy singleton ApplicationConfig.
func CurrentApplicationConfig() *ApplicationConfig {
	configOnce.Do(func() {
		// Attempt to load .env from current or parent directories
		if err := godotenv.Load(".env"); err != nil {
			if parentErr := godotenv.Load("../../.env"); parentErr != nil {
				log.Println("[INFO] No .env file found; reading system environment variables directly")
			}
		}

		idleTimeout, err := strconv.Atoi(getEnv("ROOM_IDLE_TIMEOUT_MINUTES", "10"))
		if err != nil {
			idleTimeout = 10
		}

		configInstance = &ApplicationConfig{
			Port:                   getEnv("PORT", "8080"),
			GinMode:                getEnv("GIN_MODE", "debug"),
			ClientOrigin:           getEnv("CLIENT_ORIGIN", "http://localhost:5173"),
			NeonDatabaseUrl:        getEnv("NEON_DATABASE_URL", ""),
			DockerHost:             getEnv("DOCKER_HOST", "npipe:////./pipe/docker_engine"),
			OpenVSCodeImage:        getEnv("OPENVSCODE_IMAGE", "gitpod/openvscode-server:latest"),
			RoomIdleTimeoutMinutes: idleTimeout,
		}
	})

	return configInstance
}

func getEnv(key string, defaultValue string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultValue
	}
	return val
}
