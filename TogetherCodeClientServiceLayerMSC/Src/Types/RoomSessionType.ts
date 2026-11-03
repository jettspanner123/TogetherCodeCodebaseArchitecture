export type WorkspaceRoleType = 'UserOne' | 'UserTwo';

export interface RoomParticipantType {
  role: WorkspaceRoleType;
  nickname: string;
  sessionToken: string;
  joinedAt: string;
  isActive: boolean;
}

export interface RoomSessionType {
  roomCode: string;
  roomName: string;
  requiresPassword: boolean;
  participants: Record<string, RoomParticipantType>;
  createdAt: string;
  expiresAt: string;
}

export interface ParticipantDTOType {
  id: string;
  displayName: string;
  role: string;
  joinedAt: string;
}

export interface BackendRoomResponseDTOType {
  id: string;
  code: string;
  status: string;
  hasPassword: boolean;
  participants: ParticipantDTOType[];
  sessionToken?: string;
  assignedRole?: string;
  createdAt: string;
}

export interface CreateRoomResponseType {
  roomCode: string;
  role: WorkspaceRoleType;
  sessionToken: string;
}

export interface JoinRoomResponseType {
  roomCode: string;
  role: WorkspaceRoleType;
  sessionToken: string;
}

export interface CreateRoomBackendPayloadType {
  creatorName: string;
  password?: string;
}

export interface JoinRoomBackendPayloadType {
  displayName: string;
  password?: string;
}

export interface CreateRoomRequestType {
  roomName?: string;
  roomPassword?: string;
  nickname: string;
}

export interface JoinRoomRequestType {
  roomPassword?: string;
  nickname: string;
}
