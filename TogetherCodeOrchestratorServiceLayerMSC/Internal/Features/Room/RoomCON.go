package room

// Domain constants and invariants for the Room feature.
const (
	ROOM_STATUS_PROVISIONING = "PROVISIONING"
	ROOM_STATUS_ACTIVE       = "ACTIVE"
	ROOM_STATUS_ENDED        = "ENDED"
	ROOM_STATUS_EXPIRED      = "EXPIRED"

	ROLE_USER_ONE = "UserOne"
	ROLE_USER_TWO = "UserTwo"

	MAX_ROOM_CAPACITY = 2
	ROOM_CODE_LENGTH  = 6
	BCRYPT_COST       = 12

	WORKSPACE_ROOT_DIRECTORY = "/home/workspace"
	WORKSPACE_USER_ONE_DIR   = "/home/workspace/UserOne"
	WORKSPACE_USER_TWO_DIR   = "/home/workspace/UserTwo"
	WORKSPACE_SHARED_DIR     = "/home/workspace/shared"
)
