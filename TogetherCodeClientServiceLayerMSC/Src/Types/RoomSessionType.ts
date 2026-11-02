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

export interface CreateRoomRequestType {
  roomName: string;
  roomPassword?: string;
  nickname: string;
}

export interface JoinRoomRequestType {
  roomPassword?: string;
  nickname: string;
}
