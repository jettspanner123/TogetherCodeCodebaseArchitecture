export default class FormatHelper {
  public static current = new FormatHelper();

  public formatTimestamp(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  public formatTimeShort(date: Date = new Date()): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
