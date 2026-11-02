# TogetherCode — Project Context & Implementation Blueprint

## 1. Project Mission & Core Value Proposition

**TogetherCode** is an intuitive, developer-centric peer coding platform designed for 1:1 technical interviews, pair programming, and collaborative problem solving. 

Unlike conventional shared-buffer text editors, TogetherCode equips each user with an independent, desktop-grade **VS Code in the browser** (via OpenVSCode Server), running in a unified Docker container with a shared filesystem. 

Both participants enjoy:
* A dynamically configurable split screen (Side-by-Side 50/50, Top-and-Bottom, or Single Pane Full Screen).
* Visibility into their peer's code and workspace files.
* Unrestricted ability to inspect, navigate, and edit each other's code files.
* Live avatar presence, typing feedback, and a dedicated in-room chat & scratchpad drawer.
* Immediate zero-overhead workspace export (`.zip`) upon session completion.

---

## 2. Directory Structure Blueprint

```
TogetherCodeCodebaseArchitecture/
├── ARCHITECTURE.md                               # System design, data flow, container topology
├── CONTEXT.md                                    # Project context, rules, schema, and contracts
│
├── TogetherCodeClientServiceLayerMSC/            # Frontend (React 19 + TanStack + MSC Architecture)
│   ├── CODING-RULES.md                           # Strict Frontend Architectural Invariants
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── Src/
│       ├── Main.tsx
│       ├── App.tsx
│       ├── Routes/                               # TanStack Route definitions (*ScreenRoute.tsx)
│       ├── Features/                             # Feature-driven MSC modules
│       │   ├── HomeScreen/
│       │   └── RoomSessionScreen/
│       ├── Stores/                               # Zustand global state stores
│       │   └── ApplicationBaselineColorStateStore.ts
│       ├── Constants/                            # Global constants (*CON.tsx)
│       │   ├── ColorFactoryCON.tsx
│       │   ├── EdgeInsetsCON.tsx
│       │   └── ApplicationRouteCON.tsx
│       ├── Services/                             # Centralized singleton services
│       ├── Utilities/                            # Singleton utility classes (*Utility.ts)
│       ├── Helpers/                              # Singleton helper classes (*Helper.ts)
│       └── Types/                                # Global TypeScript types (*Type.ts)
│
└── TogetherCodeOrchestratorServiceLayerMSC/       # Backend (Go 1.23+ + Gin + Docker SDK)
    ├── CODING-RULES.md                           # Strict Backend Architectural Invariants
    ├── go.mod
    ├── go.sum
    ├── CMD/
    │   └── Server/
    │       └── Main.go
    └── Internal/
        ├── Configurations/                       # Environment and system config
        ├── Features/                             # Feature-sliced domains
        │   ├── Room/                             # RoomController, RoomService, RoomRepository, RoomModel, RoomCON
        │   ├── Container/                        # ContainerController, ContainerService, ContainerModel, ContainerCON
        │   └── Chat/                             # ChatController, ChatService, ChatRepository, ChatModel, ChatCON
        ├── Helpers/                              # Shared helper singletons (ResponseHelper, LoggerHelper)
        └── Utilities/                            # Shared pure utilities (CryptoUtility, ZipUtility)
```

---

## 3. Database Schema Specifications (Neon PostgreSQL)

```sql
-- 1. Rooms Table: High-level room metadata & lifecycle state
CREATE TABLE rooms (
    id VARCHAR(36) PRIMARY KEY,                    -- UUID v4
    code VARCHAR(16) UNIQUE NOT NULL,              -- Short human-friendly room code (e.g. TC-8492)
    password_hash VARCHAR(255),                    -- Bcrypt hashed room password (nullable for open rooms)
    status VARCHAR(32) NOT NULL DEFAULT 'active',   -- 'provisioning', 'active', 'ended', 'expired'
    container_id VARCHAR(128),                     -- Docker container ID on host
    container_port INT,                            -- Internal port mapped to OpenVSCode Server
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- 2. Room Participants Table: Audit trail of user join/leave events
CREATE TABLE room_participants (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    display_name VARCHAR(64) NOT NULL,
    role VARCHAR(16) NOT NULL,                     -- 'UserOne' (Creator) or 'UserTwo' (Peer)
    session_token VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE
);

-- 3. Chat Messages Table: Persistent archive of in-room chat messages
CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    sender_name VARCHAR(64) NOT NULL,
    sender_role VARCHAR(16) NOT NULL,              -- 'UserOne' or 'UserTwo'
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Session Logs Table: Structured operational audit events
CREATE TABLE session_logs (
    id BIGSERIAL PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,               -- 'CONTAINER_SPAWNED', 'PEER_JOINED', 'SESSION_EXPORTED', etc.
    event_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
```

---

## 4. Environment Configuration

### Backend (`TogetherCodeOrchestratorServiceLayerMSC/.env`)
```bash
# Server configuration
PORT=8080
GIN_MODE=debug
CLIENT_ORIGIN=http://localhost:5173

# Neon PostgreSQL Database
NEON_DATABASE_URL=postgres://user:password@ep-togethercode-xxx.region.neon.tech/togethercode?sslmode=require

# Docker host configuration
DOCKER_HOST=npipe:////./pipe/docker_engine         # Windows Docker Desktop named pipe (or unix:///var/run/docker.sock on Linux/macOS)
OPENVSCODE_IMAGE=gitpod/openvscode-server:latest

# Room & container quotas
ROOM_IDLE_TIMEOUT_MINUTES=10
CONTAINER_MEMORY_LIMIT_MB=1536
CONTAINER_CPU_LIMIT=1.0
WORKSPACE_ROOT_PATH=/tmp/togethercode/workspaces
```

### Frontend (`TogetherCodeClientServiceLayerMSC/.env`)
```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_BASE_URL=ws://localhost:8080/ws
VITE_PROXY_BASE_URL=http://localhost:8080/proxy
```

---

## 5. Non-Negotiable Invariants & Guarantees

1. **Zero-Assumption Protocol**:
   * If any technical, architectural, or design detail is absent from the specification, ask the user directly before writing code.
2. **Strict Frontend Rules (from `CODING-RULES.md`)**:
   * Pure TypeScript (`strict: true`), absolutely no `any`.
   * Exactly one component per file, default exported, returning `React.JSX.Element`.
   * Centralized color tokens in `ColorFactoryCON.tsx` (via `ApplicationBaselineColorStateStore.ts`).
   * Centralized spacing tokens in `EdgeInsetsCON.tsx`.
   * All non-component utilities/helpers/services must be singleton classes with `public static current = new SomeClass()`.
   * Separate static vs shared components into `Components/static/` and `Components/shared/`.
3. **Strict 1:1 Room Capacity**:
   * Exactly 2 interactive participants per room. Any subsequent join attempts receive HTTP 403 `ROOM_CAPACITY_EXCEEDED`.
4. **Data Isolation & Sandboxing**:
   * Container filesystem partitions `/UserOne` and `/UserTwo` while mounting both under `/home/workspace` to enable mutual editing without namespace collisions.
5. **No Broken Windows**:
   * Every file must compile cleanly with zero linting errors, complete docstrings, and strict typing.
