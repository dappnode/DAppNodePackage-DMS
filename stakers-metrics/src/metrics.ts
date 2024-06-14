import { networks } from "@dappnode/types";
import promClient from "prom-client";
import { getClientUrl, jsonRPCapiCallExecution, jsonRPCapiCallConsensus, consensusSyncingParser, executionSyncingParser, executionPeerParser, consensusPeerParser } from "./utils.js";
import logger from "./logger.js"; 
// Create a Registry which holds the metrics
const register = new promClient.Registry();

const executionSyncingMetric = new promClient.Gauge({
  name: "api_rpc_exec_syncing",
  help: "Whether the execution client is currently syncing or not, given by eth_syncing JSON-RPC API call",
  labelNames: ["network"],
  async collect() {
    await Promise.all(networks.map((network) => collectSyncingMetric(network, "execution")));
  },
});

const consensusSyncingMetric = new promClient.Gauge({
  name: "api_rpc_cons_syncing",
  help: "Whether the consensus client is currently syncing or not, given by /eth/v1/node/syncing JSON-RPC API call",
  labelNames: ["network"],
  async collect() {
    await Promise.all(networks.map((network) => collectSyncingMetric(network, "consensus")));
  },
});

const consensusPeerCountMetric = new promClient.Gauge({
  name: "api_rpc_cons_peers",
  help: "Number of peers connected to consensus client, given by /eth/v1/node/peer_count JSON-RPC API call",
  labelNames: ["network"],
  async collect() {
    await Promise.all(networks.map((network) => collectPeerCount(network, "consensus")));
  },
});

const executionPeerCountMetric = new promClient.Gauge({
  name: "api_rpc_exec_peers",
  help: "Number of peers connected to consensus client, given by net_peercount JSON-RPC API call",
  labelNames: ["network"],
  async collect() {
    await Promise.all(networks.map((network) => collectPeerCount(network, "execution")));
  },
});

async function collectPeerCount(network: typeof networks[number], type: "execution" | "consensus") {
  const clientUrl = getClientUrl(network, type);
  if (!clientUrl) {
    logger.warn(`${type} ClientUrl of network ${network} is null or undefined, skipping JSON-RPC call`);
    return;
  }

  let response = null;
  let peerCount = NaN; // Set to NaN to indicate an error or unknown state
  if (type === "execution") {
    const apiMethod = "net_peerCount";
    response = await jsonRPCapiCallExecution(clientUrl, apiMethod, executionPeerParser);
  } else {
    const apiMethod = "/eth/v1/node/peer_count";
    response = await jsonRPCapiCallConsensus(clientUrl, apiMethod, consensusPeerParser);
  }

  // Check if there was no error in the API call
  if (response !== null && response.response !== undefined) {
    peerCount = response.response;
  }

  const metric = type === "execution" ? executionPeerCountMetric : consensusPeerCountMetric;
  metric.set({ network: network }, peerCount);
}

async function collectSyncingMetric(network: typeof networks[number], type: "execution" | "consensus") {
  const clientUrl = getClientUrl(network, type);
  if (!clientUrl) {
    logger.warn(`${type} ClientUrl of network ${network} is null or undefined, skipping JSON-RPC call`);
    return;
  }

  let response = null;
  if (type === "execution") {
    const apiMethod = "eth_syncing";
    response = await jsonRPCapiCallExecution(clientUrl, apiMethod, executionSyncingParser);
  } else {
    const apiMethod = "/eth/v1/node/syncing";
    response = await jsonRPCapiCallConsensus(clientUrl, apiMethod, consensusSyncingParser);
  }

  // Check if there was an error in the API call
  if (response === null || response.response === undefined) {
    const metric = type === "execution" ? executionSyncingMetric : consensusSyncingMetric;
    metric.set({ network: network }, NaN); // Set to NaN to indicate an error or unknown state
    return;
  }

  // Set the metric based on the response value (true = 1, false = 0)
  const isSyncing = response.response ? 1 : 0;
  const metric = type === "execution" ? executionSyncingMetric : consensusSyncingMetric;
  metric.set({ network: network }, isSyncing);
}


register.registerMetric(consensusPeerCountMetric);
register.registerMetric(executionPeerCountMetric);
register.registerMetric(executionSyncingMetric);
register.registerMetric(consensusSyncingMetric);

export { register };
