import { getShortDnpName } from "../params";
import { DashboardUpdateData, GrafanaDashboard } from "../types";
import { GrafanaApiClient, BadRequestErrorCode } from "./grafanaApiClient";

export class BadDashboardError extends Error {}

export class GrafanaClient {
  private grafanaApiClient: GrafanaApiClient;

  constructor(API_URL: string) {
    this.grafanaApiClient = new GrafanaApiClient({ baseUrl: API_URL });
  }

  async importDashboard(
    dashboard: GrafanaDashboard,
    pkg: { dnpName: string; version: string },
    prevVersion: number | null
  ): Promise<DashboardUpdateData> {
    dashboard.uid = getDashboardUid(pkg.dnpName, dashboard.uid);
    // Clean extra data from the developer
    delete dashboard.id;
    delete dashboard.version;

    // Create folder if it doesn't exist yet
    // NOTE: folders are dashboards, they MUST have a different UID and title
    // than all its child dashboards. they don't fix the uniqueness isue
    const folderUid = getFolderUidFromDnpName(pkg.dnpName);
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
        message: `Automatic update to version ${pkg.version}`,
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

export function getFolderUidFromDnpName(dnpName: string): string {
  const shortDnpName = getShortDnpName({ dnpName });
  return sanitizeGranafaUid(shortDnpName);
}

/**
 * Packages can have one or more dashboard files
 * - The UID property is MANDATORY. It MUST end with the package short domain
 */
export function getDashboardUid(dnpName: string, uid: string | null): string {
  const shortDnpName = getShortDnpName({ dnpName });

  if (!uid) throw new BadDashboardError("dashboard.uid must be defined");
  if (typeof uid !== "string")
    throw new BadDashboardError("dashboard.uid must be a string");
  if (!uid.endsWith(shortDnpName)) {
    uid = `${uid}-${shortDnpName}`.slice(-40);
  }

  uid = sanitizeGranafaUid(uid);

  // Make sure the UID is not the same as the folder UID

  if (uid === getFolderUidFromDnpName(dnpName)) {
    uid = `dashboard-${uid}`;
  }

  return uid;
}

/**
 * Limited to 40 characters
 * Only alphanumeric + '-'
 * @param uid
 */
export function sanitizeGranafaUid(uid: string): string {
  return uid.replace(/[\W_]+/g, "-").slice(0, 40);
}
