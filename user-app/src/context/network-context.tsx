'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { SuiNetwork, SUI_NETWORKS, CURRENT_NETWORK } from '../lib/sui-config';

interface NetworkContextType {
  currentNetwork: SuiNetwork;
  setCurrentNetwork: (network: SuiNetwork) => void;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [currentNetwork, setCurrentNetwork] = useState<SuiNetwork>(CURRENT_NETWORK);

  // Load network from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('sui-network') as SuiNetwork;
    if (savedNetwork && SUI_NETWORKS[savedNetwork]) {
      setCurrentNetwork(savedNetwork);
    }
  }, []);

  return (
    <NetworkContext.Provider value={{
      currentNetwork,
      setCurrentNetwork,
    }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
