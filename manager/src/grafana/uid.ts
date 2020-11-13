import { getShortDnpName } from "../params";

/**
 * Packages can have one or more dashboard files
 * - The UID property is MANDATORY. It MUST end with the package short domain
 */
export function getDashboardUid({
  dnpName,
  uid,
  index
}: {
  dnpName: string;
  uid: string | null;
  index: number;
}): string {
  const shortDnpName = getShortDnpName({ dnpName });

  if (!uid || typeof uid !== "string") {
    uid = `${shortDnpName}-${index}`.slice(-40);
  }
  if (!uid.startsWith(shortDnpName)) {
    uid = `${shortDnpName}-${uid}`.slice(-40);
  }

  uid = sanitizeGranafaUid(uid);

  // Make sure the UID is not the same as the folder UID

  if (uid === getFolderUidFromDnpName(dnpName)) {
    uid = `${uid}-${index}`.slice(-40);
  }

  return uid;
}

export function getFolderUidFromDnpName(dnpName: string): string {
  const shortDnpName = getShortDnpName({ dnpName });
  return sanitizeGranafaUid(shortDnpName);
}

/**
 * Limited to 40 characters
 * Only alphanumeric + '-'
 * @param uid
 */
export function sanitizeGranafaUid(uid: string): string {
  return uid.replace(/[\W_]+/g, "-").slice(0, 40);
}
