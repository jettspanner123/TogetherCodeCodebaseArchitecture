package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"togethercode/orchestrator/Factory"
	"togethercode/orchestrator/Internal/Configurations"
	"togethercode/orchestrator/Internal/Features/Chat"
	"togethercode/orchestrator/Internal/Features/Container"
	"togethercode/orchestrator/Internal/Features/Room"
	"togethercode/orchestrator/Internal/Helpers"
)

func main() {
	cfg := configurations.CurrentApplicationConfig()
	gin.SetMode(cfg.GinMode)

	engine := gin.New()
	engine.Use(gin.Logger(), gin.Recovery())

	// Universal CORS middleware
	engine.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", cfg.ClientOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	endpointFactory := factory.CurrentApplicationEndpointFactory()
	responseHelper := helpers.CurrentResponseHelper()

	// Health check endpoint
	engine.GET(endpointFactory.GetHealthCheckEndpoint(), func(c *gin.Context) {
		responseHelper.SendSuccess(c, http.StatusOK, gin.H{
			"status":    "healthy",
			"service":   "TogetherCodeOrchestratorServiceLayerMSC",
			"timestamp": time.Now().UnixMilli(),
		})
	})

	// Initialize Room domain
	roomController := room.CurrentRoomController()
	roomController.RegisterRoutes(engine)

	// Initialize Reverse Proxy domain for OpenVSCode Server container
	proxyController := container.CurrentReverseProxyController()
	proxyController.RegisterRoutes(engine)

	// Initialize Real-Time WebSocket Hub for Chat & Presence
	chatController := chat.CurrentChatController()
	chatController.RegisterRoutes(engine)

	serverAddress := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("[INFO] TogetherCode Orchestrator Server listening on port %s\n", cfg.Port)
	log.Printf("[INFO] API Base: %s\n", endpointFactory.GetApiBase())

	if err := engine.Run(serverAddress); err != nil {
		log.Fatalf("[FATAL] Server terminated with error: %v\n", err)
	}
}
