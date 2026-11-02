export default class WorkspaceCON {
  public static readonly DEFAULT_SPLIT_PERCENTAGE: number = 50;
  public static readonly MIN_SPLIT_PERCENTAGE: number = 20;
  public static readonly MAX_SPLIT_PERCENTAGE: number = 80;

  public static readonly WEBSOCKET_HEARTBEAT_INTERVAL_MS: number = 25000;
  public static readonly WEBSOCKET_RECONNECT_DELAY_MS: number = 3000;
  public static readonly TYPING_DEBOUNCE_MS: number = 1500;

  public static readonly LABEL_USER_ONE: string = 'UserOne Workspace';
  public static readonly LABEL_USER_TWO: string = 'UserTwo Workspace';
  public static readonly EXPORT_ZIP_FILENAME_TEMPLATE: string = 'TogetherCode-{CODE}-Workspace.zip';
}
