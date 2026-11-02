package helpers

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// APIResponse represents the standardized JSON envelope returned by all endpoints.
type APIResponse[T any] struct {
	Success   bool   `json:"success"`
	Data      T      `json:"data,omitempty"`
	Error     string `json:"error,omitempty"`
	ErrorCode string `json:"errorCode,omitempty"`
	Timestamp int64  `json:"timestamp"`
}

// ResponseHelper provides standardized helper methods for dispatching API responses.
type ResponseHelper struct{}

var (
	responseHelperInstance *ResponseHelper
	responseHelperOnce     sync.Once
)

// CurrentResponseHelper returns the thread-safe lazy singleton ResponseHelper.
func CurrentResponseHelper() *ResponseHelper {
	responseHelperOnce.Do(func() {
		responseHelperInstance = &ResponseHelper{}
	})
	return responseHelperInstance
}

// SendSuccess sends a successful JSON response with the provided payload.
func (h *ResponseHelper) SendSuccess(c *gin.Context, statusCode int, data any) {
	c.JSON(statusCode, APIResponse[any]{
		Success:   true,
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	})
}

// SendError sends an error JSON response with the specified error code and message.
func (h *ResponseHelper) SendError(c *gin.Context, statusCode int, errorCode string, message string) {
	c.JSON(statusCode, APIResponse[any]{
		Success:   false,
		ErrorCode: errorCode,
		Error:     message,
		Timestamp: time.Now().UnixMilli(),
	})
}

// SendValidationError sends a 422 Unprocessable Entity response containing validation details.
func (h *ResponseHelper) SendValidationError(c *gin.Context, validationErrors any) {
	c.JSON(http.StatusUnprocessableEntity, APIResponse[any]{
		Success:   false,
		ErrorCode: "VALIDATION_FAILED",
		Error:     "One or more validation constraints failed",
		Data:      validationErrors,
		Timestamp: time.Now().UnixMilli(),
	})
}
