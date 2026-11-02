import APIClientUtility from '@/Utilities/APIClientUtility';
import ApplicationEndpointFactory from '@/Factories/ApplicationEndpointFactory';
import {
  CreateRoomRequestType,
  CreateRoomResponseType,
  JoinRoomRequestType,
  JoinRoomResponseType,
  RoomSessionType,
} from '@/Types/RoomSessionType';

export default class LobbyService {
  public static current = new LobbyService();

  public async createRoom(payload: CreateRoomRequestType): Promise<CreateRoomResponseType> {
    const response = await APIClientUtility.current.post<CreateRoomResponseType, CreateRoomRequestType>(
      ApplicationEndpointFactory.ROOMS,
      payload
    );

    if (!response.data) {
      throw new Error(response.message || 'Failed to obtain room creation data');
    }
    return response.data;
  }

  public async joinRoom(roomCode: string, payload: JoinRoomRequestType): Promise<JoinRoomResponseType> {
    const url = ApplicationEndpointFactory.FormatJoinRoom(roomCode);
    const response = await APIClientUtility.current.post<JoinRoomResponseType, JoinRoomRequestType>(
      url,
      payload
    );

    if (!response.data) {
      throw new Error(response.message || 'Failed to obtain join room data');
    }
    return response.data;
  }

  public async getRoomDetails(roomCode: string): Promise<RoomSessionType> {
    const url = ApplicationEndpointFactory.FormatRoomByCode(roomCode);
    const response = await APIClientUtility.current.get<RoomSessionType>(url);

    if (!response.data) {
      throw new Error(response.message || 'Room not found');
    }
    return response.data;
  }
}
