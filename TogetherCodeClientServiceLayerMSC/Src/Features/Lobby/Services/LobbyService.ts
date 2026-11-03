import APIClientUtility from '@/Utilities/APIClientUtility';
import ApplicationEndpointFactory from '@/Factories/ApplicationEndpointFactory';
import {
  BackendRoomResponseDTOType,
  CreateRoomBackendPayloadType,
  CreateRoomRequestType,
  CreateRoomResponseType,
  JoinRoomBackendPayloadType,
  JoinRoomRequestType,
  JoinRoomResponseType,
  RoomParticipantType,
  RoomSessionType,
  WorkspaceRoleType,
} from '@/Types/RoomSessionType';

export default class LobbyService {
  public static current = new LobbyService();

  public async createRoom(payload: CreateRoomRequestType): Promise<CreateRoomResponseType> {
    const backendPayload: CreateRoomBackendPayloadType = {
      creatorName: payload.nickname,
      password: payload.roomPassword,
    };

    const response = await APIClientUtility.current.post<BackendRoomResponseDTOType, CreateRoomBackendPayloadType>(
      ApplicationEndpointFactory.ROOMS,
      backendPayload
    );

    if (!response.data) {
      throw new Error(response.message || 'Failed to obtain room creation data');
    }

    return {
      roomCode: response.data.code,
      role: (response.data.assignedRole as WorkspaceRoleType) || 'UserOne',
      sessionToken: response.data.sessionToken || '',
    };
  }

  public async joinRoom(roomCode: string, payload: JoinRoomRequestType): Promise<JoinRoomResponseType> {
    const url = ApplicationEndpointFactory.FormatJoinRoom(roomCode);
    const backendPayload: JoinRoomBackendPayloadType = {
      displayName: payload.nickname,
      password: payload.roomPassword,
    };

    const response = await APIClientUtility.current.post<BackendRoomResponseDTOType, JoinRoomBackendPayloadType>(
      url,
      backendPayload
    );

    if (!response.data) {
      throw new Error(response.message || 'Failed to obtain join room data');
    }

    return {
      roomCode: response.data.code,
      role: (response.data.assignedRole as WorkspaceRoleType) || 'UserTwo',
      sessionToken: response.data.sessionToken || '',
    };
  }

  public async getRoomDetails(roomCode: string): Promise<RoomSessionType> {
    const url = ApplicationEndpointFactory.FormatRoomByCode(roomCode);
    const response = await APIClientUtility.current.get<BackendRoomResponseDTOType>(url);

    if (!response.data) {
      throw new Error(response.message || 'Room not found');
    }

    const participantsMap: Record<string, RoomParticipantType> = {};
    if (Array.isArray(response.data.participants)) {
      for (const p of response.data.participants) {
        const normalizedRole: WorkspaceRoleType = p.role === 'UserOne' ? 'UserOne' : 'UserTwo';
        participantsMap[normalizedRole] = {
          role: normalizedRole,
          nickname: p.displayName,
          sessionToken: '',
          joinedAt: p.joinedAt,
          isActive: true,
        };
      }
    }

    return {
      roomCode: response.data.code,
      roomName: `Pair Session ${response.data.code}`,
      requiresPassword: response.data.hasPassword,
      participants: participantsMap,
      createdAt: response.data.createdAt,
      expiresAt: '',
    };
  }
}
