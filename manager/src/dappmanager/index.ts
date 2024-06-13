import { Manifest, PublicPackage } from "../types";
import { urlJoin } from "../utils";
import { request } from "http";
import { URL } from "url";

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
    return this.fetchJson(urlJoin(this.baseUrl, "/public-packages"));
  }

  async fetchPackageManifest({
    name,
    version
  }: {
    name: string;
    version: string;
  }): Promise<Manifest> {
    const manifest = await this.fetchJson(
      urlJoin(this.baseUrl, `/package-manifest/${name}`)
    );

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

  private fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const { hostname, pathname, search } = new URL(url);

      const options = {
        hostname,
        path: pathname + search,
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      };

      const req = request(options, res => {
        let data = "";

        res.on("data", chunk => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(
              new Error(`Request failed with status code ${res.statusCode}`)
            );
            return;
          }

          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on("error", err => {
        reject(err);
      });

      req.end();
    });
  }
}
