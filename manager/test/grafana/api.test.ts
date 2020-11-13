import { expect } from "chai";
import { exec } from "child_process";
import { promisify } from "util";
import { GrafanaClient } from "../../src/grafana";
import { GrafanaApiClient } from "../../src/grafana/grafanaApiClient";

describe("GrafanaClient", function () {
  this.timeout(10 * 1000);

  const GRAFANA_CONATINER = "test-grafana";
  const GRAFANA_PORT = 8000;
  const API_URL = `http://localhost:${GRAFANA_PORT}`;

  const grafanaClient = new GrafanaClient(API_URL);
  const grafanaApiClient = new GrafanaApiClient({ baseUrl: API_URL });

  const shortName = "prysm-" + String(Math.random()).slice(2, 7);
  const dnpName = shortName + ".dnp.dappnode.eth";

  before("Start grafana", async function () {
    // Allow ample time to pull image
    this.timeout(5 * 60 * 1000);

    await cleanContainer(GRAFANA_CONATINER);

    await promisify(exec)(
      [
        "docker run",
        `--name ${GRAFANA_CONATINER}`,
        // [auth.anonymous]
        // enabled = true
        // org_role = Admin
        "--env GF_AUTH_ANONYMOUS_ENABLED=true",
        "--env GF_AUTH_ANONYMOUS_ORG_ROLE=Admin",
        `-p ${GRAFANA_PORT}:3000`,
        "--detach",
        "grafana/grafana"
      ].join(" ")
    );

    // Some time for grafana to start
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  const dashboard = {
    uid: shortName,
    title: `${shortName} Dashboard`,
    schemaVersion: 16,
    description: "nonce 1"
  };

  it("Should import a new dashboard", async () => {
    const res = await grafanaClient.importDashboard({
      dashboard,
      dnpName,
      dnpVersion: "0.1.0",
      index: 0,
      prevVersion: null
    });
    expect(res).to.deep.equal({ uid: dashboard.uid, version: 1 });
  });

  it("Should update the dashboard", async () => {
    const dashboardV2 = { ...dashboard, description: "nonce 2" };
    const res = await grafanaClient.importDashboard({
      dashboard: dashboardV2,
      dnpName,
      dnpVersion: "0.2.0",
      index: 0,
      prevVersion: null
    });
    expect(res).to.deep.equal({ uid: dashboard.uid, version: 2 });
  });

  it("Should skip updating the dashboard if it is edited by the user", async () => {
    const dashboardV2 = { ...dashboard, description: "nonce 3" };
    const res = await grafanaClient.importDashboard({
      dashboard: dashboardV2,
      dnpName,
      dnpVersion: "0.2.0",
      index: 0,
      prevVersion: 1
    });
    expect(res).to.deep.equal({ uid: dashboard.uid, version: 2 });
  });

  it("Should remove the dashboards", async () => {
    const dashboardBefore = await grafanaApiClient.getDashboard(dashboard.uid);
    expect(dashboardBefore?.dashboard.uid).to.equal(
      dashboard.uid,
      "Dashboard should exist"
    );

    await grafanaClient.removeDashboards(dnpName);

    const dashboardAfter = await grafanaApiClient.getDashboard(dashboard.uid);
    expect(dashboardAfter).to.equal(null, "Dashboard should not exist");
  });

  after("clean-up", async () => {
    await cleanContainer(GRAFANA_CONATINER);
  });
});

async function cleanContainer(containerId: string) {
  try {
    await promisify(exec)(`docker rm -f ${containerId}`);
  } catch (e) {
    if (!e.message.includes("No such container")) throw e;
  }
}
