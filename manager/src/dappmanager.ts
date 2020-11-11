import got from "got";
import { Manifest, PublicPackage } from "./types";
import { urlJoin } from "./utils";

export class DappmanagerClient {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async fetchPublicPackages(): Promise<PublicPackage[]> {
    return await got(urlJoin(this.baseUrl, "/public-packages")).json();
  }

  async fetchPackageManifest(dnpName: string): Promise<Manifest> {
    return await got(
      urlJoin(this.baseUrl, `/package-manifest/${dnpName}`)
    ).json();
  }
}
