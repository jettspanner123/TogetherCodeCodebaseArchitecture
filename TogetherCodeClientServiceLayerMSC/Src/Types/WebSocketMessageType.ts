import { WorkspaceRoleType } from './RoomSessionType';

export type WebSocketEventType = 'PRESENCE' | 'CHAT' | 'TYPING' | 'SYSTEM';

export interface WebSocketPresencePayloadType {
  role: WorkspaceRoleType;
  nickname: string;
  status: 'online' | 'offline';
}

export interface WebSocketChatPayloadType {
  role: WorkspaceRoleType;
  nickname: string;
  message: string;
  timestamp: string;
}

export interface WebSocketTypingPayloadType {
  role: WorkspaceRoleType;
  isTyping: boolean;
}

export interface WebSocketMessageEnvelopeType {
  type: WebSocketEventType;
  payload: WebSocketPresencePayloadType | WebSocketChatPayloadType | WebSocketTypingPayloadType | Record<string, unknown>;
}
