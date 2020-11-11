import fs from "fs";
import { expect } from "chai";
import { StoredPackageDb, StoredPackage } from "../src/db";

describe("StoredPackageDb", () => {
  const dbPath = ".temp-file-db.json";

  before("clean", () => {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });
  after("clean", () => {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });

  const db = new StoredPackageDb(dbPath);

  it("Store and retrieve pkg data", () => {
    const pkg: StoredPackage = {
      dnpName: "pryms.dnp.dappnode.eth",
      version: "0.1.0",
      dashboards: [{ uid: "prysm", version: 2 }]
    };

    db.set(pkg);

    expect(db.get(pkg.dnpName)).to.deep.equal(pkg, "wrong db.get data");
    expect(db.getAll()).to.deep.equal([pkg], "wrong db.getAll data");

    db.del(pkg.dnpName);

    expect(db.getAll()).to.deep.equal([], "db should be empty");
  });
});
