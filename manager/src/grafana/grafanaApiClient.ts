import got, { OptionsOfTextResponseBody } from "got";
import { urlJoin } from "../utils";

export class GrafanaApiClient {
  baseUrl: string;
  token?: string;

  constructor({ baseUrl, token }: { baseUrl: string; token?: string }) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  // POST /api/dashboards/db HTTP/1.1
  async createUpdateDashboard(
    body: CreateUpdateBody
  ): Promise<CreateUpdateDashboardResponse> {
    return this.fetch("/api/dashboards/db", {
      method: "POST",
      json: body
    });
  }

  // GET /api/dashboards/uid/cIBgcSjkk HTTP/1.1
  async getDashboard(uid: string): Promise<GetDashboardResponse> {
    return this.fetch("/api/dashboards/uid/" + uid, { method: "GET" });
  }

  // DELETE /api/dashboards/uid/cIBgcSjkk HTTP/1.1
  async delDashboard(uid: string): Promise<DelDashboardResponse> {
    return this.fetch("/api/dashboards/uid/" + uid, { method: "DELETE" });
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
    return await got(urlJoin(this.baseUrl, url), {
      headers: this.getHeaders(),
      ...options
    }).json();

    // 200 – Created
    // 400 – Errors (invalid json, missing or invalid fields, etc)
    // 401 – Unauthorized
    // 403 – Access denied
    // 412 – Precondition failed
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
    id?: string | null;
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
  };
}

interface DelDashboardResponse {
  title: string; // "Production Overview",
  message: string; // "Dashboard Production Overview deleted",
  id: number; // 2
}
