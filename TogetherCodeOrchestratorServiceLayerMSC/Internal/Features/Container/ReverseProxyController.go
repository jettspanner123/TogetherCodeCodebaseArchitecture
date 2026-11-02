package container

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"togethercode/orchestrator/Factory"
	"togethercode/orchestrator/Internal/Helpers"
)

// ReverseProxyController proxies incoming browser traffic directly to the OpenVSCode Server container.
type ReverseProxyController struct {
	containerService *ContainerService
	responseHelper   *helpers.ResponseHelper
	endpointFactory  *factory.ApplicationEndpointFactory
}

var (
	reverseProxyControllerInstance *ReverseProxyController
	reverseProxyControllerOnce     sync.Once
)

// CurrentReverseProxyController returns the thread-safe lazy singleton ReverseProxyController.
func CurrentReverseProxyController() *ReverseProxyController {
	reverseProxyControllerOnce.Do(func() {
		reverseProxyControllerInstance = &ReverseProxyController{
			containerService: CurrentContainerService(),
			responseHelper:   helpers.CurrentResponseHelper(),
			endpointFactory:  factory.CurrentApplicationEndpointFactory(),
		}
	})
	return reverseProxyControllerInstance
}

// RegisterRoutes registers the reverse proxy wildcard route into Gin.
func (ctrl *ReverseProxyController) RegisterRoutes(engine *gin.Engine) {
	// Matches /ReverseProxy/Rooms/:Code/*Path
	engine.Any(ctrl.endpointFactory.GetReverseProxyEndpoint(), ctrl.HandleProxy)
}

// HandleProxy handles HTTP and WebSocket reverse proxying to the OpenVSCode Server instance.
func (ctrl *ReverseProxyController) HandleProxy(c *gin.Context) {
	code := c.Param("Code")
	if code == "" {
		ctrl.responseHelper.SendError(c, http.StatusBadRequest, "MISSING_ROOM_CODE", "Room code is required")
		return
	}

	containerInstance, exists := ctrl.containerService.GetContainer(code)
	if !exists {
		// Attempt to auto-spawn if room is active
		var err error
		containerInstance, err = ctrl.containerService.SpawnContainer(c.Request.Context(), code)
		if err != nil {
			ctrl.responseHelper.SendError(c, http.StatusNotFound, "CONTAINER_UNAVAILABLE", fmt.Sprintf("Failed to initialize editor container: %v", err))
			return
		}
	}

	targetURL, err := url.Parse(fmt.Sprintf("http://127.0.0.1:%d", containerInstance.HostPort))
	if err != nil {
		ctrl.responseHelper.SendError(c, http.StatusInternalServerError, "PROXY_CONFIGURATION_ERROR", "Failed to parse proxy target")
		return
	}

	proxy := httputil.NewSingleHostReverseProxy(targetURL)

	// Custom Director to rewrite request path for OpenVSCode
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Host = targetURL.Host

		// Strip the /ReverseProxy/Rooms/:Code prefix so OpenVSCode receives its expected root path
		prefix := fmt.Sprintf("/ReverseProxy/Rooms/%s", code)
		if strings.HasPrefix(req.URL.Path, prefix) {
			req.URL.Path = strings.TrimPrefix(req.URL.Path, prefix)
			if req.URL.Path == "" {
				req.URL.Path = "/"
			}
		}

		// Ensure WebSocket headers are correctly forwarded
		if req.Header.Get("Upgrade") != "" {
			req.Header.Set("Upgrade", req.Header.Get("Upgrade"))
			req.Header.Set("Connection", "Upgrade")
		}
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, proxyErr error) {
		http.Error(w, fmt.Sprintf("Proxy connection error: %v", proxyErr), http.StatusBadGateway)
	}

	proxy.ServeHTTP(c.Writer, c.Request)
}
