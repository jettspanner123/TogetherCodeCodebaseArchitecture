export default class ApplicationConfiguration {
  public static current = new ApplicationConfiguration();

  public getApiBaseUrl(): string {
    return '';
  }

  public getWebSocketBaseUrl(): string {
    const isSecure = window.location.protocol === 'https:';
    const protocol = isSecure ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
}
