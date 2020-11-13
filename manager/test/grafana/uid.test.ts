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
        args: { dnpName: "prysm.dnp.dappnode.eth", uid: null, index: 0 },
        result: "prysm-0"
      },
      {
        id: "Bad UID",
        args: {
          dnpName: "prysm.dnp.dappnode.eth",
          uid: ({} as any) as null,
          index: 0
        },
        result: "prysm-0"
      },
      {
        id: "Same UID as folder",
        args: {
          dnpName: "prysm.dnp.dappnode.eth",
          uid: "prysm",
          index: 0
        },
        result: "prysm-0"
      },
      {
        id: "Too long UID",
        args: {
          dnpName: "prysm.dnp.dappnode.eth",
          uid: "p".repeat(80),
          index: 0
        },
        result: "p".repeat(40)
      },
      {
        id: "UID with special characters",
        args: {
          dnpName: "prysm.dnp.dappnode.eth",
          uid: "Prysm dashboard //--",
          index: 0
        },
        result: "prysm-Prysm-dashboard-"
      }
    ];

    for (const { id, args, result } of testCases) {
      it(id, () => {
        expect(getDashboardUid(args)).to.equal(result);
      });
    }
  });
});
