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
    const dashboardData = getDashboardUid({ dnpName, dashboard, index });
    // Minimize the risk of collisions by using sanitized uid and title props
    dashboard.uid = dashboardData.uid;
    dashboard.title = dashboardData.title;
    // Clean extra data from the developer
    delete dashboard.id;
    delete dashboard.version;

    // Create folder if it doesn't exist yet
    // NOTE: folders are dashboards, they MUST have a different UID and title
    // than all its child dashboards. they don't fix the uniqueness isue
    const folderData = getFolderUidFromDnpName(dnpName);
    const folder =
      (await this.grafanaApiClient.getFolder(folderData.uid)) ||
      (await this.grafanaApiClient.createFolder({
        uid: folderData.uid,
        title: folderData.title
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
    const folderData = getFolderUidFromDnpName(dnpName);
    await this.grafanaApiClient.deleteFolder(folderData.uid);
  }
}
