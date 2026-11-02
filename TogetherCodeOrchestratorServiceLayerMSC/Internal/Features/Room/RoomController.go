package room

import (
	"errors"
	"fmt"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"togethercode/orchestrator/Factory"
	"togethercode/orchestrator/Internal/Features/Container"
	"togethercode/orchestrator/Internal/Helpers"
	"togethercode/orchestrator/Internal/Utilities"
)

// RoomController handles incoming HTTP traffic for room creation, joining, and inspection.
type RoomController struct {
	service         *RoomService
	responseHelper  *helpers.ResponseHelper
	endpointFactory *factory.ApplicationEndpointFactory
}

var (
	roomControllerInstance *RoomController
	roomControllerOnce     sync.Once
)

// CurrentRoomController returns the thread-safe lazy singleton RoomController.
func CurrentRoomController() *RoomController {
	roomControllerOnce.Do(func() {
		roomControllerInstance = &RoomController{
			service:         CurrentRoomService(),
			responseHelper:  helpers.CurrentResponseHelper(),
			endpointFactory: factory.CurrentApplicationEndpointFactory(),
		}
	})
	return roomControllerInstance
}

// RegisterRoutes registers all room routes into the Gin engine using ApplicationEndpointFactory.
func (ctrl *RoomController) RegisterRoutes(engine *gin.Engine) {
	engine.POST(ctrl.endpointFactory.GetRoomsEndpoint(), ctrl.HandleCreateRoom)
	engine.GET(ctrl.endpointFactory.GetRoomByCodeEndpoint(), ctrl.HandleGetRoom)
	engine.POST(ctrl.endpointFactory.GetJoinRoomEndpoint(), ctrl.HandleJoinRoom)
	engine.POST(ctrl.endpointFactory.GetExportRoomEndpoint(), ctrl.HandleExportRoom)
}

// HandleCreateRoom creates a new room session.
func (ctrl *RoomController) HandleCreateRoom(c *gin.Context) {
	var req CreateRoomRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		ctrl.responseHelper.SendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", err.Error())
		return
	}

	if valErrors := req.Validate(); len(valErrors) > 0 {
		ctrl.responseHelper.SendValidationError(c, valErrors)
		return
	}

	response, err := ctrl.service.CreateRoom(c.Request.Context(), &req)
	if err != nil {
		ctrl.responseHelper.SendError(c, http.StatusInternalServerError, "ROOM_CREATION_FAILED", err.Error())
		return
	}

	ctrl.responseHelper.SendSuccess(c, http.StatusCreated, response)
}

// HandleGetRoom retrieves public room information.
func (ctrl *RoomController) HandleGetRoom(c *gin.Context) {
	code := c.Param("Code")
	if code == "" {
		ctrl.responseHelper.SendError(c, http.StatusBadRequest, "MISSING_ROOM_CODE", "Room code is required")
		return
	}

	response, err := ctrl.service.GetRoomByCode(c.Request.Context(), code)
	if err != nil {
		if errors.Is(err, ErrRoomNotFound) {
			ctrl.responseHelper.SendError(c, http.StatusNotFound, "ROOM_NOT_FOUND", "Room not found")
			return
		}
		ctrl.responseHelper.SendError(c, http.StatusInternalServerError, "FETCH_ROOM_FAILED", err.Error())
		return
	}

	ctrl.responseHelper.SendSuccess(c, http.StatusOK, response)
}

// HandleJoinRoom allows a peer to join an existing room session.
func (ctrl *RoomController) HandleJoinRoom(c *gin.Context) {
	code := c.Param("Code")
	if code == "" {
		ctrl.responseHelper.SendError(c, http.StatusBadRequest, "MISSING_ROOM_CODE", "Room code is required")
		return
	}

	var req JoinRoomRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		ctrl.responseHelper.SendError(c, http.StatusBadRequest, "INVALID_REQUEST_BODY", err.Error())
		return
	}

	if valErrors := req.Validate(); len(valErrors) > 0 {
		ctrl.responseHelper.SendValidationError(c, valErrors)
		return
	}

	response, err := ctrl.service.JoinRoom(c.Request.Context(), code, &req)
	if err != nil {
		switch {
		case errors.Is(err, ErrRoomNotFound):
			ctrl.responseHelper.SendError(c, http.StatusNotFound, "ROOM_NOT_FOUND", "Room not found")
		case errors.Is(err, ErrInvalidPassword):
			ctrl.responseHelper.SendError(c, http.StatusUnauthorized, "INVALID_PASSWORD", "Incorrect room password")
		case errors.Is(err, ErrRoomFull):
			ctrl.responseHelper.SendError(c, http.StatusForbidden, "ROOM_CAPACITY_EXCEEDED", "This room is currently full (max 2 participants)")
		case errors.Is(err, ErrRoomEnded):
			ctrl.responseHelper.SendError(c, http.StatusGone, "ROOM_ENDED", "This room session has already ended")
		default:
			ctrl.responseHelper.SendError(c, http.StatusInternalServerError, "JOIN_ROOM_FAILED", err.Error())
		}
		return
	}

	ctrl.responseHelper.SendSuccess(c, http.StatusOK, response)
}

// HandleExportRoom zips and streams the workspace files, concluding the pairing session.
func (ctrl *RoomController) HandleExportRoom(c *gin.Context) {
	code := c.Param("Code")
	if code == "" {
		ctrl.responseHelper.SendError(c, http.StatusBadRequest, "MISSING_ROOM_CODE", "Room code is required")
		return
	}

	containerService := container.CurrentContainerService()
	workspaceDir, err := containerService.GetWorkspaceDirectory(code)
	if err != nil {
		ctrl.responseHelper.SendError(c, http.StatusNotFound, "WORKSPACE_NOT_FOUND", "Workspace directory not found for this room")
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"togethercode-%s-workspace.zip\"", code))
	c.Header("Content-Type", "application/zip")

	zipUtility := utilities.CurrentZipUtility()
	if err := zipUtility.CompressDirectory(workspaceDir, c.Writer); err != nil {
		ctrl.responseHelper.SendError(c, http.StatusInternalServerError, "EXPORT_FAILED", fmt.Sprintf("Failed to generate zip: %v", err))
		return
	}

	// Gracefully stop the container
	go func() {
		_ = containerService.StopAndRemoveContainer(c.Request.Context(), code)
	}()
}

