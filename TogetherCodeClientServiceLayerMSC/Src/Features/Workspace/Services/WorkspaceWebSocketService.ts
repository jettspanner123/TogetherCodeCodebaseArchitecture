import ApplicationEndpointFactory from '@/Factories/ApplicationEndpointFactory';
import { WebSocketMessageEnvelopeType, WebSocketEventType } from '@/Types/WebSocketMessageType';
import { WorkspaceRoleType } from '@/Types/RoomSessionType';

type MessageListener = (data: WebSocketMessageEnvelopeType) => void;
type StatusListener = (connected: boolean) => void;

export default class WorkspaceWebSocketService {
  public static current = new WorkspaceWebSocketService();

  private socket: WebSocket | null = null;
  private messageListeners: Set<MessageListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private heartbeatTimer: number | null = null;

  public connect(roomCode: string, token: string): void {
    this.disconnect();

    const baseUrl = ApplicationEndpointFactory.FormatWebSocketRoom(roomCode);
    const wsUrl = `${baseUrl}?token=${encodeURIComponent(token)}`;

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
    this.sendEnvelope('CHAT', { message });
  }

  public sendTypingPulse(role: WorkspaceRoleType, isTyping: boolean): void {
    this.sendEnvelope('TYPING', { role, isTyping });
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

  private sendEnvelope(type: WebSocketEventType, payload: Record<string, unknown>): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const envelope: WebSocketMessageEnvelopeType = { type, payload };
      this.socket.send(JSON.stringify(envelope));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      this.sendEnvelope('PRESENCE', { status: 'heartbeat' });
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
