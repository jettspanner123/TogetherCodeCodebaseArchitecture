export default class ApplicationEndpointFactory {
  public static readonly HEALTH_CHECK: string = '/HealthCheck';
  public static readonly ROOMS: string = '/Api/V1/Rooms';
  public static readonly ROOM_BY_CODE: string = '/Api/V1/Rooms/:Code';
  public static readonly JOIN_ROOM: string = '/Api/V1/Rooms/:Code/Join';
  public static readonly EXPORT_ROOM: string = '/Api/V1/Rooms/:Code/Export';
  public static readonly WEBSOCKET_ROOM: string = '/WebSocket/Rooms/:Code';
  public static readonly REVERSE_PROXY_USER_ONE: string = '/ReverseProxy/Rooms/:Code/?folder=/home/workspace/UserOne';
  public static readonly REVERSE_PROXY_USER_TWO: string = '/ReverseProxy/Rooms/:Code/?folder=/home/workspace/UserTwo';

  public static FormatRoomByCode(code: string): string {
    return this.ROOM_BY_CODE.replace(':Code', encodeURIComponent(code));
  }

  public static FormatJoinRoom(code: string): string {
    return this.JOIN_ROOM.replace(':Code', encodeURIComponent(code));
  }

  public static FormatExportRoom(code: string): string {
    return this.EXPORT_ROOM.replace(':Code', encodeURIComponent(code));
  }

  public static FormatWebSocketRoom(code: string, protocol: 'ws:' | 'wss:' = 'ws:', host: string = window.location.host): string {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : protocol;
    const wsHost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `${window.location.hostname}:8080`
        : host;
    const path = this.WEBSOCKET_ROOM.replace(':Code', encodeURIComponent(code));
    return `${wsProtocol}//${wsHost}${path}`;
  }

  public static FormatReverseProxyUserOne(code: string): string {
    return this.REVERSE_PROXY_USER_ONE.replace(':Code', encodeURIComponent(code));
  }

  public static FormatReverseProxyUserTwo(code: string): string {
    return this.REVERSE_PROXY_USER_TWO.replace(':Code', encodeURIComponent(code));
  }
}
