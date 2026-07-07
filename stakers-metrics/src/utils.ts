import axios, { AxiosError } from "axios";
import logger from "./logger.js";

export const networks = ["mainnet", "gnosis", "lukso", "hoodi"] as const;
export type Network = (typeof networks)[number];

export const executionClients = [
  "geth.dnp.dappnode.eth",
  "besu.public.dappnode.eth",
  "erigon.dnp.dappnode.eth",
  "nethermind.public.dappnode.eth",
  "nethermind-xdai.dnp.dappnode.eth",
  "gnosis-erigon.dnp.dappnode.eth",
  "lukso-geth.dnp.dappnode.eth",
  "hoodi-geth.dnp.dappnode.eth",
  "hoodi-erigon.dnp.dappnode.eth",
  "hoodi-nethermind.dnp.dappnode.eth",
  "hoodi-besu.dnp.dappnode.eth",
] as const;

export const consensusClients = [
  "lodestar.dnp.dappnode.eth",
  "prysm.dnp.dappnode.eth",
  "lighthouse.dnp.dappnode.eth",
  "teku.dnp.dappnode.eth",
  "nimbus.dnp.dappnode.eth",
  "lighthouse-gnosis.dnp.dappnode.eth",
  "teku-gnosis.dnp.dappnode.eth",
  "lodestar-gnosis.dnp.dappnode.eth",
  "nimbus-gnosis.dnp.dappnode.eth",
  "prysm-lukso.dnp.dappnode.eth",
  "teku-lukso.dnp.dappnode.eth",
  "prysm-hoodi.dnp.dappnode.eth",
  "lighthouse-hoodi.dnp.dappnode.eth",
  "teku-hoodi.dnp.dappnode.eth",
  "nimbus-hoodi.dnp.dappnode.eth",
  "lodestar-hoodi.dnp.dappnode.eth",
] as const;

/**
 * Gets the client URL for a given network and type (execution or consensus).
 * @param network - The network for which the client URL is required.
 * @param type - The type of client (execution or consensus).
 * @returns The client URL for the specified network and type, or undefined if not found.
 */
export function getClientUrl(network: Network, clientType: "execution" | "consensus"): string | undefined {
  // Get the dnpname of the client we want to call via env variable.
  const envKey = `_DAPPNODE_GLOBAL_${clientType.toUpperCase()}_CLIENT_${network.toUpperCase()}`;
  const envValue = process.env[envKey];

  try {
    // If envValue is undefined, the function will return undefined by default. If not, it will try to get the client URL from the dnpname.
    return envValue ? getJsonRpcApiFromDnpName(envValue) : undefined;
  } catch (error) {
    logger.error(`Error getting client URL from the dnp ${envKey} with value ${envValue}: ${error}`);
    return undefined;
  }
}

/** Validates DAppNode package name format */
function isValidDnpName(dnpName: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.(dnp|public)\.dappnode\.eth$/i.test(dnpName);
}

/**
 * Returns the JSON-RPC API URL for a given DNP name.
 */
function getJsonRpcApiFromDnpName(dnpName: string): string {
  if (!isValidDnpName(dnpName)) throw new Error("Invalid DNP name format.");

  const [pkgName, tld] = dnpName.split(".");
  let host: string;
  let port: string;

  if (executionClients.includes(dnpName as typeof executionClients[number])) {
    host = pkgName;
    port = "8545";
  } else if (consensusClients.includes(dnpName as typeof consensusClients[number])) {
    if (pkgName.startsWith("nimbus")) {
      host = `beacon-validator.${pkgName}`;
      port = "4500";
    } else {
      host = `beacon-chain.${pkgName}`;
      port = "3500";
    }
  } else {
    throw new Error(`The DNP ${dnpName} does not correspond to an execution or consensus client.`);
  }

  return `http://${host}.${tld === "dnp" ? "dappnode" : "public.dappnode"}:${port}`;
}


export async function jsonRPCapiCallExecution(
    url: string,
    APImethod: string,
    responseParser: (data: any) => any,
    params?: string[]
  ): Promise<{ response: any } | null> {
    try {
      logger.debug(`Calling ${url}`);
      const response = await axios.post(url, {
        jsonrpc: "2.0",
        method: APImethod,
        params: params || [],
        id: 0,
      });
      return { response: responseParser(response.data) };
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.debug(`Error calling ${url}: ${axiosError.message}`);
      return null;
    }
  }
  
  export async function jsonRPCapiCallConsensus(
    baseURL: string,
    endpoint: string,
    responseParser: (data: any) => any
  ): Promise<{ response: any } | null> {
    const url = `${baseURL}${endpoint}`;
    try {
      logger.debug(`Calling ${url}`);
      const response = await axios.get(url);
      return { response: responseParser(response.data) };
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.debug(`Error calling ${url}: ${axiosError.message}`);
      return null;
    }
  }

// Response parser for execution API call
export function executionSyncingParser(data: any): any {
    // Expecting response in the form of { "result": true/false }
    return data.result;
}

// Response parser for consensus API call
export function consensusSyncingParser(data: any): any {
    // Expecting response in the form of { "data": { "is_syncing": true/false } }
    return data.data.is_syncing;
}

// Response parser for execution API call
export function executionPeerParser(data: any): any {
    // Expecting response in the form of { "result": "0x2" }
    // Convert the hexadecimal result to an integer
    return parseInt(data.result, 16);
  }
  
  // Response parser for consensus API call
export function consensusPeerParser(data: any): any {
    // Expecting response in the form of { "data": { "connected": "56" } }
    // Parsing the "connected" field and converting it to an integer
    return parseInt(data.data.connected, 10);
  }