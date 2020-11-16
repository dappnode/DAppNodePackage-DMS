import { DappmanagerClient } from "../dappmanager";
import { StoredPackageDb } from "../db";
import { BadDashboardError, GrafanaClient } from "../grafana";
import { PrometheusClient } from "../prometheus";
import { PublicPackage, DashboardUpdateData } from "../types";
import { flatten } from "../utils";

/**
 * Makes sure local monitoring files are in sync with DAPPMANAGER's installed packages
 * 1. Poll DAPPMANAGER public pkgs versions
 * 2. Diff with local state and detect new, updates, removed
 * 3. For new or update pkgs, query DAPPMANAGER for latest manifest
 *    to get the full manifest including the grafana dashboards
 *    and prometheus targets if any
 * 4. If they exist install them by
 *    4.1 Querying the grafana HTTP API
 *    4.2 Writing prometheus targets to the common docker volume
 */

export class MonitoringManager {
  prometheusClient: PrometheusClient;
  grafanaClient: GrafanaClient;
  dappmanagerClient: DappmanagerClient;
  db: StoredPackageDb;
  private interval?: NodeJS.Timeout;

  constructor({
    intervalMs,
    prometheusClient,
    grafanaClient,
    dappmanagerClient,
    db
  }: {
    intervalMs: number;
    prometheusClient: PrometheusClient;
    grafanaClient: GrafanaClient;
    dappmanagerClient: DappmanagerClient;
    db: StoredPackageDb;
  }) {
    this.prometheusClient = prometheusClient;
    this.grafanaClient = grafanaClient;
    this.dappmanagerClient = dappmanagerClient;
    this.db = db;

    this.run();
    this.interval = setInterval(() => {
      this.run();
    }, intervalMs);
  }

  async run() {
    await this.syncMonitoringFiles().catch(e => {
      console.log(`Error on syncMonitoringFiles`, e);
    });
  }

  async stop() {
    if (this.interval) clearInterval(this.interval);
  }

  async syncMonitoringFiles() {
    const publicPackages = await this.dappmanagerClient.fetchPublicPackages();

    for (const pkg of publicPackages) {
      const currentPkg = this.db.get(pkg.name);
      if (!currentPkg || currentPkg.version !== pkg.version) {
        await this.updatePackageMonitoringFiles(pkg)
          .then(() => console.log(`Updated ${pkg.name} to ${pkg.version}`))
          .catch(e => {
            console.log(`Error updating ${pkg.name} ${pkg.version} files`, e);
          });
      }
    }

    for (const pkg of this.db.getAll()) {
      const { dnpName } = pkg;
      if (!publicPackages.find(p => p.name === dnpName))
        await this.removePackageMonitoringFiles(dnpName)
          .then(() => console.log(`Removed ${dnpName}`))
          .catch(e => {
            console.log(`Error removing ${dnpName} files`, e);
          });
    }
  }

  async updatePackageMonitoringFiles(pkg: PublicPackage): Promise<void> {
    const dnpName = pkg.name;
    const version = pkg.version;
    const manifest = await this.dappmanagerClient.fetchPackageManifest(pkg);
    // const pkgData = parseManifest(pkg, manifest);

    // Update prometheus targets always
    if (manifest.prometheusTargets) {
      await this.prometheusClient.importTarget(
        dnpName,
        flatten(manifest.prometheusTargets)
      );
    }

    // Update grafana if there has been no extra modification
    const dbData = this.db.get(dnpName);
    const currentDashboards = dbData?.dashboards || [];
    const updatedDashboards: DashboardUpdateData[] = [];

    await Promise.all(
      (manifest.grafanaDashboards || []).map(async (dashboard, index) => {
        try {
          const prevVersion =
            currentDashboards.find(d => d.uid === dashboard.uid)?.version ??
            null;
          const updatedDashboard = await this.grafanaClient.importDashboard({
            dashboard,
            dnpName,
            dnpVersion: version,
            index,
            prevVersion
          });
          updatedDashboards.push(updatedDashboard);
        } catch (e) {
          if (e instanceof BadDashboardError) {
            console.error(
              `Ignoring bad dashboard ${dnpName} ${dashboard.uid}: ${e.message}`
            );
          } else {
            throw e;
          }
        }
      })
    );

    this.db.set({ dnpName, version, dashboards: updatedDashboards });
  }

  async removePackageMonitoringFiles(dnpName: string): Promise<void> {
    await this.prometheusClient.removeTarget(dnpName);
    await this.grafanaClient.removeDashboards(dnpName);
    this.db.del(dnpName);
  }
}
