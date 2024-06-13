import { urlJoin } from "../utils";
import { request } from "http";
import { URL } from "url";

// Use string equality, since instanceof doesn't work. I know, WTF
export const BadRequestErrorCode = "BAD_REQUEST";
export const NotFoundErrorCode = "NOT_FOUND";
export class BadRequestError extends Error {
  code = BadRequestErrorCode;
}
export class NotFoundError extends Error {
  code = NotFoundErrorCode;
}

export class GrafanaApiClient {
  baseUrl: string;
  token?: string;

  constructor({ baseUrl, token }: { baseUrl: string; token?: string }) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  // POST /api/dashboards/db HTTP/1.1
  async createUpdateDashboard(
    json: CreateUpdateBody
  ): Promise<CreateUpdateDashboardResponse> {
    return await this.fetch("/api/dashboards/db", { method: "POST", json });
  }

  // GET /api/dashboards/uid/cIBgcSjkk HTTP/1.1
  async getDashboard(uid: string): Promise<GetDashboardResponse | null> {
    try {
      return await this.fetch("/api/dashboards/uid/" + uid, { method: "GET" });
    } catch (e) {
      if (e.code === NotFoundErrorCode) return null;
      else throw e;
    }
  }

  // DELETE /api/dashboards/uid/cIBgcSjkk HTTP/1.1
  async delDashboard(uid: string): Promise<DelDashboardResponse> {
    return await this.fetch("/api/dashboards/uid/" + uid, { method: "DELETE" });
  }

  // GET /api/folders
  async getAllFolders(): Promise<FolderDataShort[]> {
    return await this.fetch("/api/folders/", { method: "GET" });
  }

  // GET /api/folders/:uid
  /**
   * WARNING! On 404 returns HTML, not a proper error code
   */
  // async getFolder(uid: string): Promise<FolderData | null> {
  //   try {
  //     return await this.fetch("/api/folders/uid/" + uid, { method: "GET" });
  //   } catch (e) {
  //     if (e.message.includes("not found")) return null;
  //     else throw e;
  //   }
  // }
  async getFolder(uid: string): Promise<FolderDataShort | null> {
    const folders = await this.getAllFolders();
    return folders.find(folder => folder.uid === uid) ?? null;
  }

  // POST /api/folders
  async createFolder(json: {
    uid: string; // "nErXDvCkzz",
    title: string; // "Department ABC"
  }): Promise<FolderData> {
    if (json.uid.length > 40) throw Error("UID must be under 40 characters");
    return await this.fetch("/api/folders", { method: "POST", json });
  }

  // DELETE /api/folders/:uid
  async deleteFolder(
    uid: string
  ): Promise<{
    message: string; // "Folder deleted";
    id: number; // 2;
  } | null> {
    try {
      return await this.fetch("/api/folders/" + uid, { method: "DELETE" });
    } catch (e) {
      if (e.code === NotFoundErrorCode) return null;
      else throw e;
    }
  }

  // Accept: application/json
  // Content-Type: application/json
  // Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    headers["Content-Type"] = "application/json";
    return headers;
  }

  private async fetch<T>(
    url: string,
    options: { method: string; json?: any }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const { hostname, pathname, search } = new URL(
        urlJoin(this.baseUrl, url)
      );
      const requestBody = options.json ? JSON.stringify(options.json) : null;

      const requestOptions = {
        hostname,
        path: pathname + search,
        method: options.method,
        headers: {
          ...this.getHeaders(),
          "Content-Length": requestBody ? Buffer.byteLength(requestBody) : 0
        }
      };

      const req = request(requestOptions, res => {
        let data = "";

        res.on("data", chunk => {
          data += chunk;
        });

        res.on("end", () => {
          if (
            res.statusCode &&
            (res.statusCode < 200 || res.statusCode >= 300)
          ) {
            let errorMessage = `Request failed with status code ${res.statusCode}`;
            if (res.headers["content-type"] === "application/json") {
              try {
                const jsonError = JSON.parse(data);
                errorMessage = jsonError.message;
              } catch (err) {
                // Ignore JSON parse error
              }
            }
            switch (res.statusCode) {
              case 400:
                return reject(new BadRequestError(errorMessage));
              case 404:
                return reject(new NotFoundError(errorMessage));
              default:
                return reject(new Error(errorMessage));
            }
          }

          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(
              new Error(
                `Error parsing JSON: ${err.message} - ${url}\n${data.slice(
                  0,
                  50
                )}`
              )
            );
          }
        });
      });

      req.on("error", err => {
        reject(err);
      });

      if (requestBody) {
        req.write(requestBody);
      }
      req.end();
    });
  }
}

interface CreateUpdateBody {
  dashboard: {
    id?: number | null;
    uid: string | null;
  };
  folderId: number;
  overwrite: boolean;
  message: string;
  refresh?: string;
}

interface CreateUpdateDashboardResponse {
  id: number;
  uid: string;
  url: string;
  status: string;
  version: number;
  slug: string;
  folderId: number;
}

interface GetDashboardResponse {
  dashboard: {
    id: number;
    uid: string;
    title: string;
    tags: string[];
    timezone: string;
    schemaVersion: number;
    version: number;
  };
  meta: {
    isStarred: boolean;
    url: string;
    slug: string;
    isFolder: boolean;
    folderId: number;
    folderTitle: string;
    folderUrl: string;
  };
}

interface DelDashboardResponse {
  title: string;
  message: string;
  id: number;
}

interface FolderDataShort {
  id: number;
  uid: string;
  title: string;
}

interface FolderData {
  id: number;
  uid: string;
  title: string;
  url: string;
  hasAcl: boolean;
  canSave: boolean;
  canEdit: boolean;
  canAdmin: boolean;
  createdBy: string;
  created: string;
  updatedBy: string;
  updated: string;
  version: number;
}
