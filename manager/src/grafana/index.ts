import { DashboardUpdateData, GrafanaDashboard } from "../types";
import { GrafanaApiClient, BadRequestErrorCode } from "./grafanaApiClient";
import { getDashboardUid, getFolderUidFromDnpName } from "./uid";

export class BadDashboardError extends Error {}

export class GrafanaClient {
  private grafanaApiClient: GrafanaApiClient;

  constructor(API_URL: string) {
    this.grafanaApiClient = new GrafanaApiClient({ baseUrl: API_URL });
  }

  async importDashboard({
    dashboard,
    dnpName,
    dnpVersion,
    index,
    prevVersion
  }: {
    dashboard: GrafanaDashboard;
    dnpName: string;
    dnpVersion: string;
    index: number;
    prevVersion: number | null;
  }): Promise<DashboardUpdateData> {
    dashboard.uid = getDashboardUid({ dnpName, uid: dashboard.uid, index });
    // Clean extra data from the developer
    delete dashboard.id;
    delete dashboard.version;

    // Create folder if it doesn't exist yet
    // NOTE: folders are dashboards, they MUST have a different UID and title
    // than all its child dashboards. they don't fix the uniqueness isue
    const folderUid = getFolderUidFromDnpName(dnpName);
    const folder =
      (await this.grafanaApiClient.getFolder(folderUid)) ||
      (await this.grafanaApiClient.createFolder({
        uid: folderUid,
        title: folderUid
      }));

    const currentDashboard = await this.grafanaApiClient.getDashboard(
      dashboard.uid
    );

    if (currentDashboard) {
      if (currentDashboard.meta.isFolder) {
        throw new BadDashboardError(`UID ${dashboard.uid} is a folder`);
      }

      // Update only if the user has not modified the dashboard
      const currentVersion = currentDashboard.dashboard.version;
      if (prevVersion != null && prevVersion < currentVersion) {
        return {
          uid: currentDashboard.dashboard.uid,
          version: currentVersion
        };
      }

      dashboard.id = currentDashboard.dashboard.id;
    }

    const data = await this.grafanaApiClient
      .createUpdateDashboard({
        dashboard,
        overwrite: true,
        message: `Automatic update to version ${dnpVersion}`,
        folderId: folder.id
      })
      .catch(e => {
        if (e.code === BadRequestErrorCode)
          throw new BadDashboardError(`Error updating dashboard: ${e.message}`);
        else throw e;
      });

    return {
      uid: data.uid,
      version: data.version
    };
  }

  /**
   * Remove all dashboards for dnpName only if exists
   */
  async removeDashboards(dnpName: string): Promise<void> {
    const folderUid = getFolderUidFromDnpName(dnpName);
    await this.grafanaApiClient.deleteFolder(folderUid);
  }
}
