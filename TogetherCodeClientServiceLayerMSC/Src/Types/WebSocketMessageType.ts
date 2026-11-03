import { WorkspaceRoleType } from './RoomSessionType';

export type WebSocketEventType =
  | 'CONNECT'
  | 'DISCONNECT'
  | 'PRESENCE'
  | 'TYPING'
  | 'CHAT'
  | 'SCRATCHPAD'
  | 'ERROR';

export interface WebSocketMessageEnvelopeType {
  type: WebSocketEventType;
  roomCode?: string;
  senderName?: string;
  senderRole?: WorkspaceRoleType;
  payload?: string;
  isTyping?: boolean;
  timestamp?: number;
}
