export interface CreateRoomFormData {
  roomName: string;
  nickname: string;
  roomPassword?: string;
}

export interface JoinRoomFormData {
  roomCode: string;
  nickname: string;
  roomPassword?: string;
}
