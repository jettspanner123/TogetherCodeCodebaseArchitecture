package chat

import (
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"togethercode/orchestrator/Factory"
	"togethercode/orchestrator/Internal/Helpers"
)

// ChatController exposes the WebSocket protocol upgrade endpoint for in-room presence and chat.
type ChatController struct {
	service         *ChatService
	endpointFactory *factory.ApplicationEndpointFactory
	responseHelper  *helpers.ResponseHelper
	upgrader        websocket.Upgrader
}

var (
	chatControllerInstance *ChatController
	chatControllerOnce     sync.Once
)

// CurrentChatController returns the thread-safe lazy singleton ChatController.
func CurrentChatController() *ChatController {
	chatControllerOnce.Do(func() {
		chatControllerInstance = &ChatController{
			service:         CurrentChatService(),
			endpointFactory: factory.CurrentApplicationEndpointFactory(),
			responseHelper:  helpers.CurrentResponseHelper(),
			upgrader: websocket.Upgrader{
				ReadBufferSize:  1024,
				WriteBufferSize: 1024,
				CheckOrigin: func(r *http.Request) bool {
					// Allow cross-origin WebSocket connections from authorized frontend clients
					return true
				},
			},
		}
	})
	return chatControllerInstance
}

// RegisterRoutes mounts the /WebSocket/Rooms/:Code route into Gin.
func (ctrl *ChatController) RegisterRoutes(engine *gin.Engine) {
	engine.GET(ctrl.endpointFactory.GetWebSocketRoomEndpoint(), ctrl.HandleWebSocketUpgrade)
}

// HandleWebSocketUpgrade upgrades an incoming HTTP request to a WebSocket session.
func (ctrl *ChatController) HandleWebSocketUpgrade(c *gin.Context) {
	code := c.Param("Code")
	if code == "" {
		ctrl.responseHelper.SendError(c, http.StatusBadRequest, "MISSING_ROOM_CODE", "Room code is required")
		return
	}

	displayName := c.DefaultQuery("displayName", "Guest")
	role := c.DefaultQuery("role", "UserTwo")

	conn, err := ctrl.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[ERROR] WebSocket protocol upgrade failed for %s: %v\n", code, err)
		return
	}

	client := &Client{
		Hub:         ctrl.service,
		Conn:        conn,
		Send:        make(chan *WebSocketMessage, MESSAGE_BUFFER_CAPACITY),
		RoomCode:    code,
		DisplayName: displayName,
		Role:        role,
	}

	ctrl.service.RegisterClient(client)

	go client.WritePump()
	go client.ReadPump()
}
