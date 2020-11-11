import { PublicPackage } from "./types";

export function getPackagesToAddAndRemove(
  newPackages: PublicPackage[],
  lastPackages: PublicPackage[]
): {
  packagesToAdd: PublicPackage[];
  packagesToRemove: PublicPackage[];
} {
  const packagesToAdd: PublicPackage[] = [];
  const packagesToRemove: PublicPackage[] = [];

  for (const pkg of newPackages) {
    const lastPkg = lastPackages.find(p => p.name === pkg.name);
    if (!lastPkg || lastPkg.version !== pkg.version) packagesToAdd.push(pkg);
  }

  for (const lastPkg of lastPackages) {
    const pkg = newPackages.find(p => p.name === lastPkg.name);
    if (!pkg) packagesToRemove.push(lastPkg);
  }

  return { packagesToAdd, packagesToRemove };
}

/**
 * Joins multiple url parts safely
 * - Does not break the protocol double slash //
 * - Cleans double slashes at any point
 * @param args ("http://ipfs.io", "ipfs", "Qm")
 * @returns "http://ipfs.io/ipfs/Qm"
 */
export function urlJoin(...args: string[]): string {
  return args.join("/").replace(/([^:]\/)\/+/g, "$1");
}

export function flatten<T>(arrays: (T | T[])[]): T[] {
  return arrays.flat() as T[];
}
