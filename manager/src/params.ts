export const GRAFANA_API_URL = "http://grafana:80";
export const PROMETHEUS_TARGETS_DIR = "/provisioning";
export const DAPPMANAGER_API_URL = "http://my.dappnode";
export const JSON_DB_PATH = "/data/db.json";

export const getShortDnpName = ({ dnpName }: { dnpName: string }): string => {
  for (const s of [".dnp.dappnode.eth", ".dappnode.eth", ".eth"])
    if (dnpName.endsWith(s)) return dnpName.slice(0, -s.length);
  return dnpName;
};
