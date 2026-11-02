export default class ColorFactoryCON {
  // Background Tokens
  public static readonly BACKGROUND_BASE: string = '#0a0a0c';
  public static readonly BACKGROUND_CARD: string = '#121217';
  public static readonly BACKGROUND_ELEVATED: string = '#1a1a24';
  public static readonly BACKGROUND_MUTED: string = '#242432';

  // Border Tokens
  public static readonly BORDER_SUBTLE: string = '#27273a';
  public static readonly BORDER_MUTED: string = '#3b3b54';
  public static readonly BORDER_ACCENT: string = '#585880';

  // User Accents (Zero ambiguity between UserOne and UserTwo)
  public static readonly USER_ONE_PRIMARY: string = '#38bdf8'; // Sky Blue
  public static readonly USER_ONE_MUTED: string = 'rgba(56, 189, 248, 0.15)';
  public static readonly USER_ONE_GLOW: string = 'rgba(56, 189, 248, 0.35)';

  public static readonly USER_TWO_PRIMARY: string = '#a855f7'; // Purple / Violet
  public static readonly USER_TWO_MUTED: string = 'rgba(168, 85, 247, 0.15)';
  public static readonly USER_TWO_GLOW: string = 'rgba(168, 85, 247, 0.35)';

  // Semantic Feedback Tokens
  public static readonly SUCCESS_GREEN: string = '#10b981';
  public static readonly SUCCESS_MUTED: string = 'rgba(16, 185, 129, 0.15)';

  public static readonly WARNING_AMBER: string = '#f59e0b';
  public static readonly WARNING_MUTED: string = 'rgba(245, 158, 11, 0.15)';

  public static readonly DANGER_ROSE: string = '#f43f5e';
  public static readonly DANGER_MUTED: string = 'rgba(244, 63, 94, 0.15)';

  // Text Tokens
  public static readonly TEXT_PRIMARY: string = '#f8fafc';
  public static readonly TEXT_MUTED: string = '#94a3b8';
  public static readonly TEXT_DISABLED: string = '#64748b';
}
