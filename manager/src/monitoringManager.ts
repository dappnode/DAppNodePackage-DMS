import { DappmanagerClient } from "./dappmanager";
import { StoredPackageDb, StoredPackage } from "./db";
import { GrafanaClient, validateDashboard } from "./grafana";
import { PrometheusClient, validateTarget } from "./prometheus";
import { flatten } from "./utils";
import {
  GrafanaDashboard,
  Manifest,
  PrometheusTarget,
  PublicPackage,
  DashboardUpdateData
} from "./types";

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

    this.interval = setInterval(() => {
      this.syncMonitoringFiles().catch(e => {
        console.log(`Error on syncMonitoringFiles`, e);
      });
    }, intervalMs);
  }

  async stop() {
    if (this.interval) clearInterval(this.interval);
  }

  async syncMonitoringFiles() {
    const publicPackages = await this.dappmanagerClient.fetchPublicPackages();

    for (const pkg of publicPackages) {
      const currentPkg = this.db.get(pkg.name);
      if (!currentPkg || currentPkg.version !== pkg.version)
        await this.updatePackageMonitoringFiles(pkg).catch(e => {
          console.log(`Error updating ${pkg.name} files`, e);
        });
    }

    for (const pkg of this.db.getAll()) {
      if (!publicPackages.find(p => p.name === pkg.dnpName))
        await this.removePackageMonitoringFiles(pkg).catch(e => {
          console.log(`Error removing ${pkg.dnpName} files`, e);
        });
    }
  }

  async updatePackageMonitoringFiles(pkg: PublicPackage): Promise<void> {
    const dnpName = pkg.name;
    const version = pkg.version;
    const manifest = await this.dappmanagerClient.fetchPackageManifest(dnpName);
    const pkgData = parseManifest(pkg, manifest);

    // Update prometheus targets always
    if (pkgData.prometheusTargets) {
      await this.prometheusClient.importTarget(
        dnpName,
        pkgData.prometheusTargets
      );
    }

    // Update grafana if there has been no extra modification
    const dbData = this.db.get(dnpName);
    const currentDashboards = dbData?.dashboards || [];
    const updatedDashboards: DashboardUpdateData[] = [];

    for (const dashboard of pkgData.grafanaDashboards || []) {
      const previousVersion =
        currentDashboards.find(d => d.uid === dashboard.uid)?.version ?? null;
      const updatedDashboard = await this.grafanaClient.importDashboard(
        dashboard,
        pkgData,
        previousVersion
      );
      updatedDashboards.push(updatedDashboard);
    }

    this.db.set({ dnpName, version, dashboards: updatedDashboards });
  }

  async removePackageMonitoringFiles(pkg: StoredPackage): Promise<void> {
    const dnpName = pkg.dnpName;
    await this.prometheusClient.removeTarget(dnpName);
    await this.grafanaClient.removeDashboards(pkg.dashboards);

    this.db.del(dnpName);
  }
}

/**
 * Parses dashboards and targets from manifest
 * If some dashboard or target is invalid it is ignored
 * This function must not throw for invalid data or the MonitoringManager
 * will not write the package status to DB and it will keep querying its status in loop
 */
export function parseManifest(
  pkg: PublicPackage,
  manifest: Manifest
): {
  dnpName: string;
  version: string;
  grafanaDashboards?: GrafanaDashboard[];
  prometheusTargets?: PrometheusTarget[];
} {
  const dnpName = pkg.name;
  if (dnpName !== manifest.name)
    throw Error(`Manifest name mismatch ${dnpName} !== ${manifest.name}`);
  if (pkg.version !== manifest.version)
    throw Error(
      `Manifest version mismatch ${dnpName} ${pkg.version} !== ${manifest.version}`
    );

  const prometheusTargets =
    manifest.prometheusTargets &&
    // Make sure there are no nested targets
    flatten(manifest.prometheusTargets).filter(targets => {
      try {
        validateTarget(dnpName, targets);
        return true;
      } catch (e) {
        console.error(`Invalid ${dnpName} target: ${e.message}`);
        return false;
      }
    });

  const grafanaDashboards =
    manifest.grafanaDashboards &&
    manifest.grafanaDashboards.filter(dashboard => {
      try {
        validateDashboard(dnpName, dashboard);
        return true;
      } catch (e) {
        console.error(`Invalid ${dnpName} dashboard: ${e.message}`);
        return false;
      }
    });

  return {
    dnpName,
    version: pkg.version,
    prometheusTargets,
    grafanaDashboards
  };
}
