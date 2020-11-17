import { expect } from "chai";
import { getDashboardUid } from "../../src/grafana/uid";

describe("grafana / uid", () => {
  describe("getDashboardUid", () => {
    const testCases: {
      id: string;
      args: Parameters<typeof getDashboardUid>[0];
      result: ReturnType<typeof getDashboardUid>;
    }[] = [
      {
        id: "No UID",
        args: {
          dnpName: "prysm.dnp.dappnode.eth",
          dashboard: { uid: null },
          index: 0
        },
        result: { uid: "prysm-0", title: "prysm 0" }
      },
      {
        id: "Bad UID",
        args: {
          dnpName: "prysm.dnp.dappnode.eth",
          dashboard: { uid: ({} as any) as null },
          index: 0
        },
        result: { uid: "prysm-0", title: "prysm 0" }
      },
      {
        id: "Same UID as folder",
        args: {
          dnpName: "prysm.dnp.dappnode.eth",
          dashboard: { uid: "prysm" },
          index: 0
        },
        result: { uid: "prysm", title: "prysm 0" }
      },
      {
        id: "Too long UID",
        args: {
          dnpName: "prysm.dnp.dappnode.eth",
          dashboard: { uid: "p".repeat(80) },
          index: 0
        },
        result: { uid: "p".repeat(40), title: "prysm 0" }
      },
      {
        id: "UID with special characters",
        args: {
          dnpName: "prysm.dnp.dappnode.eth",
          dashboard: { uid: "Prysm dashboard //--" },
          index: 0
        },
        result: { uid: "prysm-Prysm-dashboard-", title: "prysm 0" }
      }
    ];

    for (const { id, args, result } of testCases) {
      it(id, () => {
        expect(getDashboardUid(args)).to.deep.equal(result);
      });
    }
  });
});
