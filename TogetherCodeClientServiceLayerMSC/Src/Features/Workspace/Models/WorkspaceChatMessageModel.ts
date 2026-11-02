import { WorkspaceRoleType } from '@/Types/RoomSessionType';

export interface WorkspaceChatMessage {
  id: string;
  role: WorkspaceRoleType;
  nickname: string;
  message: string;
  timestamp: string;
  isSelf: boolean;
}
