export default class LobbyCON {
  public static readonly HERO_BADGE: string = 'High-Speed 1:1 Live Pairing Engine';
  public static readonly HERO_TITLE_PREFIX: string = 'Real-time Pair Programming,';
  public static readonly HERO_TITLE_HIGHLIGHT: string = 'Partitioned & Synchronized';
  public static readonly HERO_DESCRIPTION: string = 'Independent full VS Code workspaces for UserOne and UserTwo on an intelligent split screen. Collaborate seamlessly with mutual viewing, real-time typing indicators, persistent chat, and instant ZIP export.';

  public static readonly BUTTON_CREATE_ROOM: string = 'Create Pairing Room';
  public static readonly BUTTON_JOIN_ROOM: string = 'Join With Room Code';

  public static readonly DEFAULT_ROOM_NAME: string = 'Full-Stack Pair Session';
  public static readonly NICKNAME_MIN_LENGTH: number = 2;
  public static readonly ROOM_CODE_LENGTH: number = 9; // e.g. "TC-ABCDEF"
}
