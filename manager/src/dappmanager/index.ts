import got from "got";
import { Manifest, PublicPackage } from "../types";
import { urlJoin } from "../utils";

export const ManifestMismatchErrorCode = "MANIFEST_MISMATCH";
export class ManifestMismatchError extends Error {
  code = ManifestMismatchErrorCode;
}

export class DappmanagerClient {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async fetchPublicPackages(): Promise<PublicPackage[]> {
    return await got(urlJoin(this.baseUrl, "/public-packages")).json();
  }

  async fetchPackageManifest({
    name,
    version
  }: {
    name: string;
    version: string;
  }): Promise<Manifest> {
    const manifest = await got(
      urlJoin(this.baseUrl, `/package-manifest/${name}`)
    ).json<Manifest>();

    if (name !== manifest.name)
      throw new ManifestMismatchError(
        `Manifest name mismatch ${name} !== ${manifest.name}`
      );
    if (version !== manifest.version)
      throw new ManifestMismatchError(
        `Manifest version mismatch ${name} ${version} !== ${manifest.version}`
      );

    return manifest;
  }
}
