import { validateDashboard } from "../grafana";
import { validateTarget } from "../prometheus";
import {
  GrafanaDashboard,
  Manifest,
  PrometheusTarget,
  PublicPackage
} from "../types";
import { flatten } from "../utils";

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
