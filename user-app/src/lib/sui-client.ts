import { SuiClient } from '@mysten/sui.js/client';
import { SUI_NETWORKS, CURRENT_NETWORK, type SuiNetwork } from './sui-config';

// Sui client instances for different networks
const clients: Record<SuiNetwork, SuiClient> = {
  testnet: new SuiClient({ url: SUI_NETWORKS.testnet.rpcUrl }),
  mainnet: new SuiClient({ url: SUI_NETWORKS.mainnet.rpcUrl }),
  devnet: new SuiClient({ url: SUI_NETWORKS.devnet.rpcUrl }),
};

// Get Sui client for specific network
export function getSuiClient(network: SuiNetwork = CURRENT_NETWORK): SuiClient {
  return clients[network];
}

// Get default Sui client
export function getDefaultSuiClient(): SuiClient {
  return getSuiClient(CURRENT_NETWORK);
}

// Network utilities
export function getNetworkConfig(network: SuiNetwork) {
  return SUI_NETWORKS[network];
}

export function getAllNetworks(): SuiNetwork[] {
  return Object.keys(SUI_NETWORKS) as SuiNetwork[];
}

// Client health check
export async function checkClientHealth(network: SuiNetwork = CURRENT_NETWORK): Promise<boolean> {
  try {
    const client = getSuiClient(network);
    await client.getLatestSuiSystemState();
    return true;
  } catch (error) {
    console.error(`Health check failed for ${network}:`, error);
    return false;
  }
}

// Get network info
export async function getNetworkInfo(network: SuiNetwork = CURRENT_NETWORK) {
  try {
    const client = getSuiClient(network);
    const systemState = await client.getLatestSuiSystemState();
    
    return {
      network,
      epoch: systemState.epoch,
      totalStake: systemState.totalStake,
      systemStateVersion: systemState.systemStateVersion,
    };
  } catch (error) {
    console.error(`Failed to get network info for ${network}:`, error);
    throw error;
  }
}
