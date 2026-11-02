import DownloadUtility from '@/Utilities/DownloadUtility';
import ApplicationEndpointFactory from '@/Factories/ApplicationEndpointFactory';
import WorkspaceCON from '@/Features/Workspace/Constants/WorkspaceCON';

export default class WorkspaceExportService {
  public static current = new WorkspaceExportService();

  public async exportRoomWorkspace(roomCode: string, token?: string): Promise<void> {
    const url = ApplicationEndpointFactory.FormatExportRoom(roomCode);
    const filename = WorkspaceCON.EXPORT_ZIP_FILENAME_TEMPLATE.replace('{CODE}', roomCode);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await DownloadUtility.current.downloadStreamAsFile(url, filename, headers);
  }
}
