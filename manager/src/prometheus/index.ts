import fs from "fs";
import path from "path";
import { getShortDnpName } from "../params";
import { PrometheusTarget } from "../types";

export class PrometheusClient {
  TARGETS_DIR: string;
  TARGET_EXT: string = ".json";

  constructor(TARGETS_DIR: string) {
    this.TARGETS_DIR = TARGETS_DIR;
  }

  async importTarget(
    dnpName: string,
    targets: PrometheusTarget[]
  ): Promise<void> {
    const targetsFilepath = this.getTargetsFilepath(dnpName);
    fs.writeFileSync(targetsFilepath, JSON.stringify(targets, null, 2));
  }

  /**
   * Remove target only if exists
   */
  async removeTarget(dnpName: string): Promise<void> {
    const targetsFilepath = this.getTargetsFilepath(dnpName);
    if (fs.existsSync(targetsFilepath)) fs.unlinkSync(targetsFilepath);
  }

  async listPrometheusTargets(): Promise<
    { dnpName: string; targets: PrometheusTarget[] }[]
  > {
    return fs
      .readdirSync(this.TARGETS_DIR)
      .filter(file => file.endsWith(this.TARGET_EXT))
      .map(file => ({
        dnpName: file.slice(0, -this.TARGET_EXT.length),
        targets: JSON.parse(
          fs.readFileSync(path.join(this.TARGETS_DIR, file), "utf8")
        )
      }));
  }

  private getTargetsFilepath(dnpName: string): string {
    return path.join(this.TARGETS_DIR, dnpName + this.TARGET_EXT);
  }
}

/**
 * Packages can have one or more targets file. However, they should be flatten in advance
 * - The job label is OPTIONAL. It must end with the package's short domain
 */
export function validateTarget(
  dnpName: string,
  target: PrometheusTarget
): void {
  const shortDnpName = getShortDnpName({ dnpName });

  if (target.labels && typeof target.labels === "object") {
    if (
      target.labels.job &&
      (typeof target.labels.job !== "string" ||
        !target.labels.job.endsWith(shortDnpName))
    ) {
      throw Error(
        `Prometheus target job ${target.labels.job} must end with ${shortDnpName}`
      );
    }
  }
}
