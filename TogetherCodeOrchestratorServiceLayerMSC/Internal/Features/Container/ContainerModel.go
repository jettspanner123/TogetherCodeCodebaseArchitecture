package container

import "time"

// ContainerInstance represents an active OpenVSCode Server container runtime.
type ContainerInstance struct {
	RoomCode      string    `json:"roomCode"`
	ContainerID   string    `json:"containerId"`
	HostPort      int       `json:"hostPort"`
	WorkspacePath string    `json:"workspacePath"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"createdAt"`
}

// ContainerStatusResponseDTO represents the public container health and readiness state.
type ContainerStatusResponseDTO struct {
	RoomCode string `json:"roomCode"`
	Status   string `json:"status"`
	HostPort int    `json:"hostPort,omitempty"`
	IsReady  bool   `json:"isReady"`
}
