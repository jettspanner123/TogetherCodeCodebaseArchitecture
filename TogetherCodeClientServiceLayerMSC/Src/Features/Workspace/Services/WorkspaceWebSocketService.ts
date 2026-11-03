import ApplicationEndpointFactory from '@/Factories/ApplicationEndpointFactory';
import { WebSocketMessageEnvelopeType } from '@/Types/WebSocketMessageType';
import { WorkspaceRoleType } from '@/Types/RoomSessionType';

type MessageListener = (data: WebSocketMessageEnvelopeType) => void;
type StatusListener = (connected: boolean) => void;

export default class WorkspaceWebSocketService {
  public static current = new WorkspaceWebSocketService();

  private socket: WebSocket | null = null;
  private messageListeners: Set<MessageListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private heartbeatTimer: number | null = null;
  private roomCode: string = '';
  private nickname: string = '';
  private role: WorkspaceRoleType = 'UserTwo';

  public connect(roomCode: string, token: string, nickname?: string, role?: WorkspaceRoleType): void {
    this.disconnect();
    this.roomCode = roomCode;
    this.nickname = nickname || '';
    this.role = role || 'UserTwo';

    const baseUrl = ApplicationEndpointFactory.FormatWebSocketRoom(roomCode);
    const params = new URLSearchParams();
    params.set('token', token);
    if (nickname) {
      params.set('displayName', nickname);
    }
    if (role) {
      params.set('role', role);
    }

    const wsUrl = `${baseUrl}?${params.toString()}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.notifyStatus(true);
        this.startHeartbeat();
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const envelope: WebSocketMessageEnvelopeType = JSON.parse(event.data);
          this.notifyMessage(envelope);
        } catch {
          // ignore malformed frame
        }
      };

      this.socket.onclose = () => {
        this.cleanup();
        this.notifyStatus(false);
      };

      this.socket.onerror = () => {
        this.cleanup();
        this.notifyStatus(false);
      };
    } catch {
      this.notifyStatus(false);
    }
  }

  public sendChatMessage(message: string): void {
    this.sendEnvelope({
      type: 'CHAT',
      roomCode: this.roomCode,
      senderName: this.nickname,
      senderRole: this.role,
      payload: message,
      timestamp: Date.now(),
    });
  }

  public sendTypingPulse(role: WorkspaceRoleType, isTyping: boolean): void {
    this.sendEnvelope({
      type: 'TYPING',
      roomCode: this.roomCode,
      senderName: this.nickname,
      senderRole: role || this.role,
      isTyping,
      timestamp: Date.now(),
    });
  }

  public subscribeToMessages(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public subscribeToStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  public disconnect(): void {
    this.cleanup();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private sendEnvelope(envelope: WebSocketMessageEnvelopeType): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(envelope));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      this.sendEnvelope({
        type: 'PRESENCE',
        roomCode: this.roomCode,
        senderName: this.nickname,
        senderRole: this.role,
        payload: 'heartbeat',
        timestamp: Date.now(),
      });
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private cleanup(): void {
    this.stopHeartbeat();
  }

  private notifyMessage(data: WebSocketMessageEnvelopeType): void {
    this.messageListeners.forEach((listener) => listener(data));
  }

  private notifyStatus(connected: boolean): void {
    this.statusListeners.forEach((listener) => listener(connected));
  }
}
