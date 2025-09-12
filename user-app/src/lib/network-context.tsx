'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { SuiNetwork, SUI_NETWORKS, CURRENT_NETWORK } from './sui-config';

interface NetworkContextType {
  currentNetwork: SuiNetwork;
  setCurrentNetwork: (network: SuiNetwork) => void;
  isNetworkSwitching: boolean;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [currentNetwork, setCurrentNetworkState] = useState<SuiNetwork>(CURRENT_NETWORK);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);

  // Load network from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('sui-network') as SuiNetwork;
    if (savedNetwork && SUI_NETWORKS[savedNetwork]) {
      setCurrentNetworkState(savedNetwork);
    }
  }, []);

  const setCurrentNetwork = (network: SuiNetwork) => {
    setIsNetworkSwitching(true);
    
    // Save to localStorage
    localStorage.setItem('sui-network', network);
    
    // Update state
    setCurrentNetworkState(network);
    
    // Simulate network switch delay
    setTimeout(() => {
      setIsNetworkSwitching(false);
    }, 500);
  };

  return (
    <NetworkContext.Provider value={{
      currentNetwork,
      setCurrentNetwork,
      isNetworkSwitching
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
