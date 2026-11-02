package factory

import "sync"

// ApplicationEndpointFactory provides centralized, unabbreviated PascalCase endpoint routes.
type ApplicationEndpointFactory struct{}

var (
	endpointFactoryInstance *ApplicationEndpointFactory
	endpointFactoryOnce     sync.Once
)

// CurrentApplicationEndpointFactory returns the thread-safe lazy singleton instance.
func CurrentApplicationEndpointFactory() *ApplicationEndpointFactory {
	endpointFactoryOnce.Do(func() {
		endpointFactoryInstance = &ApplicationEndpointFactory{}
	})
	return endpointFactoryInstance
}

// GetApiBase returns the root API prefix.
func (f *ApplicationEndpointFactory) GetApiBase() string {
	return "/Api/V1"
}

// GetHealthCheckEndpoint returns the unabbreviated health check endpoint.
func (f *ApplicationEndpointFactory) GetHealthCheckEndpoint() string {
	return "/HealthCheck"
}

// GetRoomsEndpoint returns the collection route for rooms.
func (f *ApplicationEndpointFactory) GetRoomsEndpoint() string {
	return "/Api/V1/Rooms"
}

// GetRoomByCodeEndpoint returns the path for fetching a single room by its code.
func (f *ApplicationEndpointFactory) GetRoomByCodeEndpoint() string {
	return "/Api/V1/Rooms/:Code"
}

// GetJoinRoomEndpoint returns the path for a participant joining a room.
func (f *ApplicationEndpointFactory) GetJoinRoomEndpoint() string {
	return "/Api/V1/Rooms/:Code/Join"
}

// GetExportRoomEndpoint returns the path for exporting the room workspace as a ZIP archive.
func (f *ApplicationEndpointFactory) GetExportRoomEndpoint() string {
	return "/Api/V1/Rooms/:Code/Export"
}

// GetWebSocketRoomEndpoint returns the unabbreviated PascalCase path for real-time WebSocket communication.
func (f *ApplicationEndpointFactory) GetWebSocketRoomEndpoint() string {
	return "/WebSocket/Rooms/:Code"
}

// GetReverseProxyEndpoint returns the unabbreviated PascalCase path for routing to the OpenVSCode Server container.
func (f *ApplicationEndpointFactory) GetReverseProxyEndpoint() string {
	return "/ReverseProxy/Rooms/:Code/*Path"
}
