import { create } from 'zustand';
import { WorkspaceRoleType } from '@/Types/RoomSessionType';
import ApplicationLocalStorageCON from '@/Constants/ApplicationLocalStorageCON';

interface ApplicationUserSessionState {
  roomCode: string | null;
  role: WorkspaceRoleType | null;
  nickname: string;
  sessionToken: string | null;
  isAuthenticated: boolean;
  setSession: (roomCode: string, role: WorkspaceRoleType, nickname: string, sessionToken: string) => void;
  clearSession: () => void;
}

export const useApplicationUserSessionStore = create<ApplicationUserSessionState>((set) => {
  // Hydrate from per-tab sessionStorage to prevent multi-screen peer collision
  let initialRoomCode: string | null = null;
  let initialRole: WorkspaceRoleType | null = null;
  let initialNickname: string = '';
  let initialSessionToken: string | null = null;

  try {
    const raw = sessionStorage.getItem(ApplicationLocalStorageCON.USER_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      initialRoomCode = parsed.roomCode || null;
      initialRole = parsed.role || null;
      initialNickname = parsed.nickname || '';
      initialSessionToken = parsed.sessionToken || null;
    }
  } catch {
    // ignore parsing errors
  }

  return {
    roomCode: initialRoomCode,
    role: initialRole,
    nickname: initialNickname,
    sessionToken: initialSessionToken,
    isAuthenticated: Boolean(initialRoomCode && initialRole && initialSessionToken),

    setSession: (roomCode: string, role: WorkspaceRoleType, nickname: string, sessionToken: string) => {
      const data = { roomCode, role, nickname, sessionToken };
      try {
        sessionStorage.setItem(ApplicationLocalStorageCON.USER_SESSION_KEY, JSON.stringify(data));
        sessionStorage.setItem(ApplicationLocalStorageCON.LAST_ROOM_CODE_KEY, roomCode);
        sessionStorage.setItem(ApplicationLocalStorageCON.ACTIVE_ROLE_KEY, role);
        sessionStorage.setItem(ApplicationLocalStorageCON.SESSION_TOKEN_KEY, sessionToken);
      } catch {
        // ignore storage errors
      }
      set({
        roomCode,
        role,
        nickname,
        sessionToken,
        isAuthenticated: true,
      });
    },

    clearSession: () => {
      try {
        sessionStorage.removeItem(ApplicationLocalStorageCON.USER_SESSION_KEY);
        sessionStorage.removeItem(ApplicationLocalStorageCON.ACTIVE_ROLE_KEY);
        sessionStorage.removeItem(ApplicationLocalStorageCON.SESSION_TOKEN_KEY);
      } catch {
        // ignore storage errors
      }
      set({
        roomCode: null,
        role: null,
        nickname: '',
        sessionToken: null,
        isAuthenticated: false,
      });
    },
  };
});
