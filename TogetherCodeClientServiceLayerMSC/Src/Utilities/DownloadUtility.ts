export default class DownloadUtility {
  public static current = new DownloadUtility();

  public async downloadStreamAsFile(url: string, filename: string, headers: HeadersInit = {}): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to download stream: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(anchor);
  }
}
