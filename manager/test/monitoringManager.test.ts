import { expect } from "chai";
import { parseManifest } from "../src/monitoringManager";
import {
  GrafanaDashboard,
  Manifest,
  PrometheusTarget,
  PublicPackage
} from "../src/types";

describe("parseManifest", () => {
  it("Should filter bad dashboards and targets", () => {
    const pkg: PublicPackage = {
      name: "prysm.dnp.dappnode.eth",
      version: "0.1.0",
      state: "running",
      ip: "172.33.1.2"
    };

    const targetCorrect: PrometheusTarget = {
      targets: ["prysm.dappnode:8000"],
      labels: {
        job: "prysm"
      }
    };
    const targetWrong: PrometheusTarget = {
      targets: ["prysm.dappnode:8000"],
      labels: {
        job: "something-else"
      }
    };
    const dashboardCorrect: GrafanaDashboard = {
      uid: "prysm"
    };
    const dashboardWrong: GrafanaDashboard = {
      uid: "something-else"
    };

    const manifest: Manifest = {
      name: pkg.name,
      version: pkg.version,
      prometheusTargets: [[targetCorrect], targetWrong],
      grafanaDashboards: [dashboardCorrect, dashboardWrong]
    };

    const expectedReturn: ReturnType<typeof parseManifest> = {
      dnpName: pkg.name,
      version: pkg.version,
      prometheusTargets: [targetCorrect],
      grafanaDashboards: [dashboardCorrect]
    };

    expect(parseManifest(pkg, manifest)).to.deep.equal(expectedReturn);
  });
});
