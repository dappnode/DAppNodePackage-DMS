export interface PublicPackage {
  name: string; // "medalla-validator.dnp.dappnode.eth";
  version: string; // "1.0.15";
  state: string; // "running";
  ip: string; // "172.33.0.5";
}

export interface DashboardUpdateData {
  uid: string; // "cIBgcSjkk";
  version: number; // 1;
}

export interface MonitoringFiles {
  dnpName: string;
  version: string;
  targets: PrometheusTarget[];
  dashboards: GrafanaDashboard[];
}

export interface GrafanaDashboard {
  uid: string | null;
  id?: number | null;
  version?: number
}

export interface PrometheusTarget {
  targets: string[];
  labels?: {
    job?: string;
    group?: string;
  };
}

export interface Manifest {
  name: string;
  version: string;
  grafanaDashboards?: GrafanaDashboard[];
  prometheusTargets?: (PrometheusTarget | PrometheusTarget[])[];
}
