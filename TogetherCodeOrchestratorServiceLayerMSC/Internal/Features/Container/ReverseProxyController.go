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

	// Custom Director to ensure host and upgrade headers are forwarded to OpenVSCode
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Host = targetURL.Host

		// OpenVSCode runs with --server-base-path /ReverseProxy/Rooms/:Code, so keep req.URL.Path intact.
		// If requesting room root without trailing slash, normalize to /ReverseProxy/Rooms/:Code/
		roomRoot := fmt.Sprintf("/ReverseProxy/Rooms/%s", code)
		if req.URL.Path == roomRoot {
			req.URL.Path = roomRoot + "/"
		}

		// Ensure WebSocket headers are correctly forwarded
		if strings.EqualFold(req.Header.Get("Upgrade"), "websocket") {
			req.Header.Set("Upgrade", "websocket")
			req.Header.Set("Connection", "Upgrade")
		}
	}

	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, proxyErr error) {
		// If browser is loading the editor document inside iframe, serve an auto-refreshing loading screen
		acceptHeader := r.Header.Get("Accept")
		if strings.Contains(acceptHeader, "text/html") {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.WriteHeader(http.StatusOK)
			html := `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="2">
<style>
  body { background: #0a0a0a; color: #a3a3a3; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  .spinner { width: 32px; height: 32px; border: 3px solid #262626; border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  p { font-size: 13px; font-weight: 500; letter-spacing: -0.01em; margin: 0; }
</style>
</head>
<body>
  <div class="spinner"></div>
  <p>Initializing OpenVSCode environment...</p>
  <script>setTimeout(function() { window.location.reload(); }, 1500);</script>
</body>
</html>`
			_, _ = w.Write([]byte(html))
			return
		}

		http.Error(w, fmt.Sprintf("Proxy connection error: %v", proxyErr), http.StatusBadGateway)
	}

	proxy.ServeHTTP(c.Writer, c.Request)
}
