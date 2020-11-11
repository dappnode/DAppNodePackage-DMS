import fs from "fs";
import { DashboardUpdateData } from "./types";

export interface StoredPackage {
  dnpName: string;
  version: string;
  dashboards: DashboardUpdateData[];
}

type DbSchema = {
  [dnpName: string]: StoredPackage;
};

export class StoredPackageDb {
  private db: JsonDb<DbSchema>;

  constructor(dbPath: string) {
    this.db = new JsonDb<DbSchema>(dbPath, {});
  }

  set(pkg: StoredPackage): void {
    const pkgs = this.db.read();
    pkgs[pkg.dnpName] = pkg;
    this.db.write(pkgs);
  }

  del(dnpName: string): void {
    const pkgs = this.db.read();
    delete pkgs[dnpName];
    this.db.write(pkgs);
  }

  get(dnpName: string): StoredPackage | null {
    return this.db.read()[dnpName] ?? null;
  }

  getAll(): StoredPackage[] {
    return Object.values(this.db.read());
  }

  clear(): void {
    this.db.clear();
  }
}

class JsonDb<T> {
  filepath: string;
  initialValue: T;

  constructor(filepath: string, initialValue: T) {
    this.filepath = filepath;
    this.initialValue = initialValue;
  }

  read(): T {
    try {
      return JSON.parse(fs.readFileSync(this.filepath, "utf8"));
    } catch (e) {
      if (e.code === "ENOENT") return this.initialValue;
      else throw e;
    }
  }

  write(data: T): void {
    fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2));
  }

  clear(): void {
    fs.unlinkSync(this.filepath);
  }
}
