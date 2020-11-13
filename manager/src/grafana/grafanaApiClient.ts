import got, { OptionsOfTextResponseBody, Response } from "got";
import { urlJoin } from "../utils";

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
    return headers;
  }

  private async fetch<T>(
    url: string,
    options?: OptionsOfTextResponseBody
  ): Promise<T> {
    const response = await got(urlJoin(this.baseUrl, url), {
      headers: this.getHeaders(),
      ...options
    }).catch((err: { response: Response<string>; message: string }) => {
      // e.response.body = {"message":"Dashboard name cannot be the same as folder"}
      let errorMessage = err.message;
      if (err.response?.body) {
        try {
          const jsonError = JSON.parse(err.response.body);
          errorMessage = jsonError.message;
        } catch (err2) {}
      }

      // 200 – Created
      // 400 – Errors (invalid json, missing or invalid fields, etc)
      // 401 – Unauthorized
      // 403 – Access denied
      // 412 – Precondition failed
      switch (err.response.statusCode) {
        case 400:
          throw new BadRequestError(errorMessage);
        case 404:
          throw new NotFoundError(errorMessage);
        default:
          throw err;
      }
    });

    const text = response.body;
    try {
      return JSON.parse(text);
    } catch (e) {
      throw Error(
        `Error parsing JSON: ${e.message} - ${url}\n${text.slice(0, 50)}`
      );
    }
  }
}

interface CreateUpdateBody {
  /**
   * The complete dashboard model, id = null to create a new dashboard
   */
  dashboard: {
    /**
     * id = null to create a new dashboard
     */
    id?: number | null;
    /**
     * Optional unique identifier when creating a dashboard.
     * uid = null will generate a new uid.
     */
    uid: string | null;
  };
  /**
   * The id of the folder to save the dashboard in.
   * `0`
   */
  folderId: number;
  /**
   * Set to true if you want to overwrite existing dashboard with newer version,
   * same dashboard title in folder or same dashboard uid.
   */
  overwrite: boolean;
  /**
   * Set a commit message for the version history.
   */
  message: string;
  /**
   * Set the dashboard refresh interval. If this is lower than the minimum refresh interval, then
   * Grafana will ignore it and will enforce the minimum refresh interval.
   * `"25s"`
   */
  refresh?: string;
}

interface CreateUpdateDashboardResponse {
  id: number; // 1;
  uid: string; // "cIBgcSjkk";
  url: string; // "/d/cIBgcSjkk/production-overview";
  status: string; // "success";
  version: number; // 1;
  slug: string; // "production-overview"; //deprecated in Grafana v5.0
  folderId: number; // 0,
}

interface GetDashboardResponse {
  dashboard: {
    id: 1;
    uid: "cIBgcSjkk";
    title: "Production Overview";
    tags: ["templated"];
    timezone: "browser";
    schemaVersion: 16;
    version: 0;
  };
  meta: {
    isStarred: boolean; // false;
    url: string; // "/d/cIBgcSjkk/production-overview";
    slug: string; // "production-overview"; //deprecated in Grafana v5.0
    isFolder: boolean; // true,
    folderId: number; // 0,
    folderTitle: string; // 'General',
    folderUrl: string; // '',
  };
}

interface DelDashboardResponse {
  title: string; // "Production Overview",
  message: string; // "Dashboard Production Overview deleted",
  id: number; // 2
}

interface FolderDataShort {
  id: number; // 1;
  uid: string; // "nErXDvCkzz";
  title: string; // "Department ABC";
}

interface FolderData {
  id: number; // 1;
  uid: string; // "nErXDvCkzz";
  title: string; // "Department ABC";
  url: string; // "/dashboards/f/nErXDvCkzz/department-abc";
  hasAcl: boolean; // false;
  canSave: boolean; // true;
  canEdit: boolean; // true;
  canAdmin: boolean; // true;
  createdBy: string; // "admin";
  created: string; // "2018-01-31T17:43:12+01:00";
  updatedBy: string; // "admin";
  updated: string; // "2018-01-31T17:43:12+01:00";
  version: number; //1;
}
