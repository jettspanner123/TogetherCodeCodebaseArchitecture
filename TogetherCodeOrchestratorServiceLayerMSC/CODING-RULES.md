# Backend Coding Rules (TogetherCodeOrchestratorServiceLayerMSC)

The assistant must strictly adhere to these rules before authoring or modifying any backend code.

---

## 1. Zero-Assumption Protocol
> [!IMPORTANT]
> **Strict Mandate**: If any requirement, architectural nuance, database column, external library choice, or business logic rule is ambiguous or unstated, **you must stop and ask the user directly**. Never assume, interpolate, or invent functionality.

---

## 2. Universal PascalCase Mandate (Folders, Files & Code)
- **All Folder Names must be PascalCase**: `CMD`, `Server`, `Internal`, `Features`, `Configurations`, `Helpers`, `Utilities`, `Room`, `Container`, `Chat`.
- **All File Names must be PascalCase**: `Main.go`, `RoomController.go`, `RoomService.go`, `RoomRepository.go`, `RoomModel.go`, `RoomCON.go`.
- **All Structs, Interfaces, Types, and Exported Functions must be PascalCase**: `type RoomController struct`, `func CurrentRoomService() *RoomService`.

---

## 3. General Language & Typing Invariants
- **Always Go 1.23+ with strict static typing**: Never use untyped empty interfaces (`interface{}`) where a generic type parameter (`[T any]`) or explicit struct can be used.
- **Context Propagation**: Every controller handler, service method, and repository function must accept `ctx context.Context` as its first parameter:
  ```go
  func (s *RoomService) CreateRoom(ctx context.Context, req *CreateRoomRequestDTO) (*RoomResponseDTO, error)
  ```
- **Error Handling**: Never discard or swallow errors (`_ = ...`). Always inspect and wrap errors using `fmt.Errorf("context: %w", err)`.

---

## 4. Thread-Safe Lazy Singleton Pattern (`sync.Once`)
To parallel the frontend's `SomeClass.current` pattern, all backend services, helpers, repositories, and utilities must provide a thread-safe lazy singleton accessed via a `Current*` function:

```go
package room

import "sync"

type RoomService struct {
    repo *RoomRepository
}

var (
    roomServiceInstance *RoomService
    roomServiceOnce     sync.Once
)

func CurrentRoomService() *RoomService {
    roomServiceOnce.Do(func() {
        roomServiceInstance = &RoomService{
            repo: CurrentRoomRepository(),
        }
    })
    return roomServiceInstance
}
```

---

## 5. File Structure & Domain-Driven / Feature-Sliced Topology
All domain business logic lives inside `Internal/Features/${FeatureName}/` with strict PascalCase directory and file naming:

```
TogetherCodeOrchestratorServiceLayerMSC/
├── CMD/
│   └── Server/
│       └── Main.go
└── Internal/
    ├── Configurations/
    │   └── ApplicationConfig.go
    ├── Features/
    │   ├── Room/
    │   │   ├── RoomController.go        # Gin HTTP & WebSocket route handlers
    │   │   ├── RoomService.go           # Core business logic & room lifecycle
    │   │   ├── RoomRepository.go        # Neon PostgreSQL database queries
    │   │   ├── RoomModel.go             # DTOs, domain structs, and validation
    │   │   └── RoomCON.go               # Domain constants & enums
    │   ├── Container/
    │   │   ├── ContainerController.go
    │   │   ├── ContainerService.go      # Docker Go SDK integration
    │   │   ├── ContainerModel.go
    │   │   └── ContainerCON.go
    │   └── Chat/
    │       ├── ChatController.go
    │       ├── ChatService.go           # WebSocket messaging & scratchpad notes
    │       ├── ChatRepository.go
    │       ├── ChatModel.go
    │       └── ChatCON.go
    ├── Helpers/                         # Shared helper singletons
    │   ├── ResponseHelper.go            # Standard API envelope builder
    │   └── LoggerHelper.go              # Structured logging helper
    └── Utilities/                       # Shared pure utilities
        ├── CryptoUtility.go             # Bcrypt hashing & token generation
        └── ZipUtility.go                # Workspace compression
```

---

## 6. Naming Conventions & Constants
- **Files**: PascalCase with explicit suffixes (`RoomController.go`, `RoomService.go`, `RoomRepository.go`, `RoomModel.go`, `RoomCON.go`).
- **Structs**: PascalCase matching the file name (`type RoomController struct`, `type RoomService struct`).
- **Packages**: Strictly lowercase single words (`package room`, `package container`, `package helpers`).
- **Constants**: Defined in dedicated `*CON.go` files using full uppercase with underscores (`ROOM_STATUS_ACTIVE = "ACTIVE"`, `MAX_ROOM_CAPACITY = 2`). Magic strings/numbers in controllers or services are strictly prohibited.

---

## 7. Standard API Response Envelope
Every Gin endpoint must return the standardized generic response envelope via `ResponseHelper`:

```go
type ApiResponse[T any] struct {
    Success   bool   `json:"success"`
    Data      T      `json:"data,omitempty"`
    Error     string `json:"error,omitempty"`
    ErrorCode string `json:"errorCode,omitempty"`
    Timestamp int64  `json:"timestamp"`
}
```

Usage in controllers:
```go
// Success
ResponseHelper.Current().SendSuccess(c, http.StatusOK, roomData)

// Error
ResponseHelper.Current().SendError(c, http.StatusForbidden, "ROOM_FULL", "Room has reached maximum capacity")
```

---

## 8. Hybrid Request Validation (Tags + `Validate()`)
All DTO structs in `*Model.go` must use Gin binding tags for structural validation, paired with an explicit `Validate()` method for domain rules:

```go
type CreateRoomRequestDTO struct {
    CreatorName string `json:"creatorName" binding:"required,min=2,max=32"`
    Password    string `json:"password" binding:"omitempty,min=4,max=64"`
}

func (dto *CreateRoomRequestDTO) Validate() *ValidationError {
    // Custom domain validations (regex, business limits)
    return nil
}
```

---

## 9. Database Repositories & Transactions
- All database operations are isolated in `*Repository.go` files using `*pgxpool.Pool`.
- Never write raw SQL inside controllers or services.
- Multi-step operations must use database transactions (`tx, err := repo.db.Begin(ctx)`).
