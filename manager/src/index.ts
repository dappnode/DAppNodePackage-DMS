import { GrafanaClient } from "./grafana";
import { PrometheusClient } from "./prometheus";
import { DappmanagerClient } from "./dappmanager";
import { MonitoringManager } from "./monitoring";
import { StoredPackageDb } from "./db";
import {
  GRAFANA_API_URL,
  PROMETHEUS_TARGETS_DIR,
  DAPPMANAGER_API_URL,
  JSON_DB_PATH
} from "./params";

/**
 * Formating rules:
 *
 * Packages can have one or more targets file. However, they should be flatten in advance
 * - The job label is OPTIONAL. It must end with the package's short domain
 *
 * Packages can have one or more dashboard files
 * - The UID property is MANDATORY. It MUST end with the package short domain
 *
 * Short domain examples:
 * - For prysm.dnp.dappnode.eth: `prysm`, `beacon-prysm`
 * - For prysm-medalla.dnp.dappnode.eth: `prysm-medalla`, `beacon-prysm-medalla
 *
 * Update rules:
 * - On update, only the dashboards that have not been edited by the user will be modified
 *   Use the version history to check edits, or hash the previous dashboard
 */

const grafanaClient = new GrafanaClient(GRAFANA_API_URL);
const prometheusClient = new PrometheusClient(PROMETHEUS_TARGETS_DIR);
const dappmanagerClient = new DappmanagerClient(DAPPMANAGER_API_URL);
const db = new StoredPackageDb(JSON_DB_PATH);
const monitoringManager = new MonitoringManager({
  intervalMs: 30 * 6000,
  grafanaClient,
  prometheusClient,
  dappmanagerClient,
  db
});

process.on("SIGINT", () => {
  monitoringManager.stop();
  process.exit(0);
});
