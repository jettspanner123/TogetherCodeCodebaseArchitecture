package container

import (
	"context"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
	"togethercode/orchestrator/Internal/Configurations"
)

// ContainerService orchestrates the lifecycle of gitpod/openvscode-server Docker containers.
type ContainerService struct {
	dockerClient *client.Client
	activeMutex  sync.RWMutex
	containers   map[string]*ContainerInstance // Keyed by RoomCode
	workspaceDir string
}

var (
	containerServiceInstance *ContainerService
	containerServiceOnce     sync.Once
)

// CurrentContainerService returns the thread-safe lazy singleton ContainerService.
func CurrentContainerService() *ContainerService {
	containerServiceOnce.Do(func() {
		cli, err := client.NewClientWithOpts(
			client.FromEnv,
			client.WithAPIVersionNegotiation(),
		)
		if err != nil {
			log.Printf("[WARN] Docker client initialization warning: %v. Running in mock/standby mode.\n", err)
			cli = nil
		}

		// Local workspaces storage path
		execPath, _ := os.Getwd()
		baseWorkspacesDir := filepath.Join(execPath, "Workspaces")
		_ = os.MkdirAll(baseWorkspacesDir, 0755)

		containerServiceInstance = &ContainerService{
			dockerClient: cli,
			containers:   make(map[string]*ContainerInstance),
			workspaceDir: baseWorkspacesDir,
		}
	})
	return containerServiceInstance
}

// SpawnContainer initializes the workspace directory, starter files, and starts an OpenVSCode Server container.
func (s *ContainerService) SpawnContainer(ctx context.Context, roomCode string) (*ContainerInstance, error) {
	s.activeMutex.Lock()
	defer s.activeMutex.Unlock()

	if existing, exists := s.containers[roomCode]; exists {
		return existing, nil
	}

	roomWorkspace := filepath.Join(s.workspaceDir, roomCode)
	if err := s.scaffoldStarterFiles(roomWorkspace); err != nil {
		return nil, fmt.Errorf("failed to scaffold workspace starter files: %w", err)
	}

	if s.dockerClient == nil {
		log.Printf("[WARN] Docker daemon not connected; registering mock container instance for room %s\n", roomCode)
		mockPort := s.findAvailablePort()
		mockInstance := &ContainerInstance{
			RoomCode:      roomCode,
			ContainerID:   fmt.Sprintf("mock-container-%s", roomCode),
			HostPort:      mockPort,
			WorkspacePath: roomWorkspace,
			Status:        "RUNNING_MOCK",
			CreatedAt:     time.Now(),
		}
		s.containers[roomCode] = mockInstance
		return mockInstance, nil
	}

	cfg := configurations.CurrentApplicationConfig()
	imageName := cfg.OpenVSCodeImage
	if imageName == "" {
		imageName = DEFAULT_OPENVSCODE_IMAGE
	}

	// Pull image if not cached locally
	go func() {
		pullCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()
		reader, err := s.dockerClient.ImagePull(pullCtx, imageName, image.PullOptions{})
		if err == nil {
			_, _ = io.Copy(io.Discard, reader)
			_ = reader.Close()
		}
	}()

	assignedPort := s.findAvailablePort()
	portBinding := nat.PortBinding{
		HostIP:   "0.0.0.0",
		HostPort: strconv.Itoa(assignedPort),
	}
	exposedPort := nat.Port(CONTAINER_INTERNAL_PORT + "/tcp")

	containerConfig := &container.Config{
		Image: imageName,
		Cmd: []string{
			"--host", "0.0.0.0",
			"--port", CONTAINER_INTERNAL_PORT,
			"--without-connection-token",
			"--server-base-path", fmt.Sprintf("/ReverseProxy/Rooms/%s", roomCode),
		},
		ExposedPorts: nat.PortSet{
			exposedPort: struct{}{},
		},
		Labels: map[string]string{
			"app":       CONTAINER_LABEL_APP,
			"roomCode":  roomCode,
			"managedBy": CONTAINER_LABEL_MANAGED_BY,
		},
	}

	hostConfig := &container.HostConfig{
		PortBindings: nat.PortMap{
			exposedPort: []nat.PortBinding{portBinding},
		},
		Binds: []string{
			fmt.Sprintf("%s:/home/workspace", filepath.ToSlash(roomWorkspace)),
		},
		Resources: container.Resources{
			Memory:   CONTAINER_MEMORY_LIMIT_BYTES,
			NanoCPUs: CONTAINER_NANO_CPUS,
		},
	}

	containerName := fmt.Sprintf("togethercode-room-%s", roomCode)
	resp, err := s.dockerClient.ContainerCreate(ctx, containerConfig, hostConfig, nil, nil, containerName)
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker container: %w", err)
	}

	if err := s.dockerClient.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return nil, fmt.Errorf("failed to start Docker container: %w", err)
	}

	instance := &ContainerInstance{
		RoomCode:      roomCode,
		ContainerID:   resp.ID,
		HostPort:      assignedPort,
		WorkspacePath: roomWorkspace,
		Status:        "RUNNING",
		CreatedAt:     time.Now(),
	}

	s.containers[roomCode] = instance
	log.Printf("[INFO] OpenVSCode Server container %s started for room %s on port %d\n", resp.ID[:12], roomCode, assignedPort)

	return instance, nil
}

// GetContainer retrieves the running container details for a room.
func (s *ContainerService) GetContainer(roomCode string) (*ContainerInstance, bool) {
	s.activeMutex.RLock()
	defer s.activeMutex.RUnlock()
	instance, exists := s.containers[roomCode]
	return instance, exists
}

// StopAndRemoveContainer halts and removes the container, freeing resources.
func (s *ContainerService) StopAndRemoveContainer(ctx context.Context, roomCode string) error {
	s.activeMutex.Lock()
	defer s.activeMutex.Unlock()

	instance, exists := s.containers[roomCode]
	if !exists {
		return nil
	}

	if s.dockerClient != nil && instance.ContainerID != "" && instance.Status == "RUNNING" {
		stopTimeout := 5
		_ = s.dockerClient.ContainerStop(ctx, instance.ContainerID, container.StopOptions{Timeout: &stopTimeout})
		_ = s.dockerClient.ContainerRemove(ctx, instance.ContainerID, container.RemoveOptions{Force: true})
		log.Printf("[INFO] Container %s pruned for room %s\n", instance.ContainerID[:12], roomCode)
	}

	delete(s.containers, roomCode)
	return nil
}

// GetWorkspaceDirectory returns the on-disk directory for a room.
func (s *ContainerService) GetWorkspaceDirectory(roomCode string) (string, error) {
	path := filepath.Join(s.workspaceDir, roomCode)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return "", fmt.Errorf("workspace directory does not exist for room: %s", roomCode)
	}
	return path, nil
}

func (s *ContainerService) scaffoldStarterFiles(roomWorkspace string) error {
	dirs := []string{
		filepath.Join(roomWorkspace, "UserOne"),
		filepath.Join(roomWorkspace, "UserTwo"),
		filepath.Join(roomWorkspace, "shared"),
	}

	for _, d := range dirs {
		if err := os.MkdirAll(d, 0755); err != nil {
			return err
		}
	}

	files := map[string]string{
		filepath.Join(roomWorkspace, "README.md"):             STARTER_README_ROOT,
		filepath.Join(roomWorkspace, "UserOne", "main.py"):    STARTER_USER_ONE_PY,
		filepath.Join(roomWorkspace, "UserOne", "index.js"):   STARTER_USER_ONE_JS,
		filepath.Join(roomWorkspace, "UserTwo", "main.py"):    STARTER_USER_TWO_PY,
		filepath.Join(roomWorkspace, "UserTwo", "index.js"):   STARTER_USER_TWO_JS,
		filepath.Join(roomWorkspace, "shared", "notes.txt"):   STARTER_SHARED_NOTES,
	}

	for filePath, content := range files {
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
				return err
			}
		}
	}

	return nil
}

func (s *ContainerService) findAvailablePort() int {
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		return 3001
	}
	defer listener.Close()
	return listener.Addr().(*net.TCPAddr).Port
}
