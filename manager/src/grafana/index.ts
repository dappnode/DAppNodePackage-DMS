import { getShortDnpName } from "../params";
import { DashboardUpdateData, GrafanaDashboard } from "../types";
import { GrafanaApiClient } from "./grafanaApiClient";

export class GrafanaClient {
  grafanaApiClient: GrafanaApiClient;

  constructor(API_URL: string) {
    this.grafanaApiClient = new GrafanaApiClient({ baseUrl: API_URL });
  }

  async importDashboard(
    dashboard: GrafanaDashboard,
    pkg: { dnpName: string; version: string },
    previousVersion: number | null
  ): Promise<DashboardUpdateData> {
    // Update only if the user has not modified the dashboard
    const currentDashboard = await this.getDashboard(dashboard.uid);
    if (
      currentDashboard &&
      previousVersion != null &&
      currentDashboard.version <= previousVersion
    ) {
      return currentDashboard;
    }

    validateDashboard(pkg.dnpName, dashboard);
    return await this.grafanaApiClient.createUpdateDashboard({
      dashboard,
      overwrite: true,
      message: `Automatic update to version ${pkg.version}`,
      folderId: 0
    });
  }

  /**
   * Remove dashboard only if exists
   */
  async removeDashboards(dashboards: GrafanaDashboard[]): Promise<void> {
    for (const dashboard of dashboards) {
      await this.grafanaApiClient.delDashboard(dashboard.uid);
    }
  }

  private async getDashboard(uid: string): Promise<DashboardUpdateData | null> {
    try {
      const data = await this.grafanaApiClient.getDashboard(uid);
      return {
        uid: data.dashboard.uid,
        version: data.dashboard.version
      };
    } catch (e) {
      return null;
    }
  }
}

/**
 * Packages can have one or more dashboard files
 * - The UID property is MANDATORY. It MUST end with the package short domain
 */
export function validateDashboard(
  dnpName: string,
  dashboard: GrafanaDashboard
): void {
  const shortDnpName = getShortDnpName({ dnpName });

  if (!dashboard.uid) throw Error("dashboard.uid must be defined");
  if (typeof dashboard.uid !== "string")
    throw Error("dashboard.uid must be a string");
  if (!dashboard.uid.endsWith(shortDnpName))
    throw Error(
      `dashboard.uid '${dashboard.uid}' must end with '${shortDnpName}'`
    );
}
