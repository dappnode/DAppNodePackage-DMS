import { getShortDnpName } from "../params";
import { GrafanaDashboard } from "../types";

const folderSuffix = "dashboards";

/**
 * Packages can have one or more dashboard files
 * - The UID property is MANDATORY. It MUST end with the package short domain
 */
export function getDashboardUid({
  dnpName,
  dashboard,
  index
}: {
  dnpName: string;
  dashboard: GrafanaDashboard;
  index: number;
}): { uid: string; title: string } {
  const shortDnpName = getShortDnpName({ dnpName });
  let uid = dashboard.uid;
  let title = dashboard.title;

  if (!uid || typeof uid !== "string") {
    uid = `${shortDnpName}-${index}`.slice(-40);
  }
  if (!uid.startsWith(shortDnpName)) {
    uid = `${shortDnpName}-${uid}`.slice(-40);
  }

  uid = sanitizeGranafaUid(uid);

  // Make sure the UID is not the same as the folder UID
  const folderData = getFolderUidFromDnpName(dnpName);
  if (uid.toLowerCase() === folderData.uid.toLowerCase()) {
    uid = `${uid.replace(folderSuffix, "")}-${index}`.slice(-40);
  }

  if (!title || typeof title !== "string") {
    title = `${shortDnpName} ${index}`;
  }

  // Make sure the title is not the same as the folder title
  if (title.toLowerCase() === folderData.title.toLowerCase()) {
    title = `${title.replace(folderSuffix, "")} ${index}`;
  }

  return {
    uid,
    title
  };
}

export function getFolderUidFromDnpName(
  dnpName: string
): { uid: string; title: string } {
  const shortDnpName = getShortDnpName({ dnpName });
  return {
    uid: sanitizeGranafaUid(`${shortDnpName}-${folderSuffix}`),
    title: `${shortDnpName} ${folderSuffix}`
  };
}

/**
 * Limited to 40 characters
 * Only alphanumeric + '-'
 * @param uid
 */
export function sanitizeGranafaUid(uid: string): string {
  return uid.replace(/[\W_]+/g, "-").slice(0, 40);
}
