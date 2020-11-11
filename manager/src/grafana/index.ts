import { getShortDnpName } from "../params";
import { GrafanaDashboard } from "../types";
import { GrafanaApiClient } from "./grafanaApiClient";

export class GrafanaClient {
  grafanaApiClient: GrafanaApiClient;

  constructor(API_URL: string) {
    this.grafanaApiClient = new GrafanaApiClient({ baseUrl: API_URL });
  }

  async importDashboards(
    dnpName: string,
    newVersion: string,
    dashboards: GrafanaDashboard[]
  ): Promise<void> {
    // TODO: Update only if the user has not modified the dashboard

    for (const dashboard of dashboards) {
      validateDashboard(dnpName, dashboard);
      await this.grafanaApiClient.createUpdateDashboard({
        dashboard,
        overwrite: true,
        message: `Automatic update to version ${newVersion}`,
        folderId: 0
      });
    }
  }

  /**
   * Remove dashboard only if exists
   */
  async removeDashboards(dashboards: GrafanaDashboard[]): Promise<void> {
    for (const dashboard of dashboards) {
      await this.grafanaApiClient.delDashboard(dashboard.uid);
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
    throw Error(`dashboard.uid ${dashboard.uid} must end with ${shortDnpName}`);
}
