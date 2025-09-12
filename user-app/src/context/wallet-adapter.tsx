'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  WalletProvider, 
  useCurrentWallet,
  ConnectButton,
  useSuiClient,
  useSuiClientQuery,
  useConnectWallet,
  useDisconnectWallet,
  useWallets,
  SuiClientProvider,
  useSignAndExecuteTransaction,
  useSwitchAccount,
  useAccounts,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNetwork, NetworkProvider } from './network-context';
import { getSuiClient } from '../lib/sui-client';

// Wallet context
interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  accounts: readonly { address: string; publicKey: string }[];
  connect: () => void;
  disconnect: () => void;
  switchToAccount: (account: { address: string }) => Promise<unknown>;
  signAndExecuteTransactionBlock: ({ transaction, chain }: { transaction: Transaction; chain: string }) => Promise<unknown>;
  executeTransaction: (transaction: Transaction) => Promise<unknown>;
  suiClient: ReturnType<typeof getSuiClient>;
}

const WalletContext = createContext<WalletContextType | null>(null);

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Internal wallet provider component that provides context
function WalletContextProvider({ children }: { children: ReactNode }) {
  const { currentNetwork } = useNetwork();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { mutate: switchAccount } = useSwitchAccount();
  const accounts = useAccounts();
  const wallet = useCurrentWallet();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const wallets = useWallets();
  const suiClient = useMemo(() => getSuiClient(currentNetwork), [currentNetwork]);
  
  // State to track current account address
  const [currentAccountAddress, setCurrentAccountAddress] = useState<string | null>(null);
  
  // Initialize current account address when accounts are first loaded
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      // Always update to the first account if no current account is set
      // or if the current account is not in the accounts list
      if (!currentAccountAddress || !accounts.find(acc => acc.address === currentAccountAddress)) {
        setCurrentAccountAddress(accounts[0].address);
        console.log('Initialized/Updated current account:', accounts[0].address);
      }
    }
  }, [accounts, currentAccountAddress]);
  
  // Reset current account when wallet disconnects
  useEffect(() => {
    if (!wallet.isConnected && currentAccountAddress) {
      setCurrentAccountAddress(null);
      console.log('Reset current account due to disconnection');
    }
  }, [wallet.isConnected, currentAccountAddress]);

  // Get signAndExecuteTransactionBlock from the wallet's features
  const signAndExecuteTransactionBlock = ({
    transaction,
    chain
  }: {
    transaction: Transaction;
    chain: string;
  }) => {
    return signAndExecuteTransaction({
      transaction,
      chain: `sui:${chain}` as `${string}:${string}`,
    });
  };

  // Execute transaction helper
  const executeTransaction = async (transaction: Transaction) => {
    if (!signAndExecuteTransactionBlock) {
      throw new Error('Wallet not connected or signAndExecuteTransactionBlock not available');
    }
    
    const result = await signAndExecuteTransactionBlock({
      transaction,
      chain: currentNetwork,
    });
    console.log('交易结果:', result);
    return result;
  };

  // Helper function to switch account
  const switchToAccount = (account: { address: string }) => {
    return new Promise((resolve, reject) => {
      console.log('Attempting to switch to account:', account.address);
      console.log('Current address before switch:', currentAccountAddress);
      
      // Find the full account object from the accounts list
      const fullAccount = accounts.find(acc => acc.address === account.address);
      if (!fullAccount) {
        console.error('Account not found in accounts list:', account.address);
        reject(new Error('Account not found'));
        return;
      }
      
      // Use the correct parameter format for useSwitchAccount
      switchAccount(
        { account: fullAccount },
        {
          onSuccess: (result) => {
            console.log(`Switched to account: ${account.address}`);
            console.log('Switch result:', result);
            // Update the current account address
            setCurrentAccountAddress(account.address);
            resolve(result);
          },
          onError: (error) => {
            console.error('Failed to switch account:', error);
            reject(error);
          }
        }
      );
    });
  };

  // Get current account address - use tracked current account
  const currentAddress = useMemo(() => currentAccountAddress, [currentAccountAddress]);
  
  // Debug logging
  console.log('Wallet adapter debug:', {
    isConnected: wallet.isConnected,
    currentWallet: wallet.currentWallet?.name,
    accountsCount: accounts?.length || 0,
    currentAccount: currentAccountAddress,
    currentAddress,
    allAccounts: accounts?.map(acc => acc.address) || []
  });

  const contextValue: WalletContextType = {
    connected: wallet.isConnected,
    connecting: wallet.isConnecting,
    address: currentAddress,
    accounts: (accounts || []).map(acc => ({
      address: acc.address,
      publicKey: acc.publicKey.toString()
    })) as readonly { address: string; publicKey: string }[],
    connect: () => {
      if (wallets.length > 0) {
        connect({ wallet: wallets[0] });
      }
    },
    disconnect: () => {
      disconnect();
    },
    switchToAccount,
    signAndExecuteTransactionBlock: signAndExecuteTransactionBlock as ({ transaction, chain }: { transaction: Transaction; chain: string }) => Promise<unknown>,
    executeTransaction: executeTransaction as (transaction: Transaction) => Promise<unknown>,
    suiClient,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// Wallet provider component
export function SuiWalletProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NetworkProvider>
        <SuiClientProvider
          networks={{
            testnet: { url: 'https://fullnode.testnet.sui.io:443' },
            mainnet: { url: 'https://fullnode.mainnet.sui.io:443' },
            devnet: { url: 'https://fullnode.devnet.sui.io:443' },
          }}
          defaultNetwork="testnet"
        >
          <WalletProvider
            autoConnect={false}
            storageKey="sui-wallet-adapter"
          >
            <WalletContextProvider>
              {children}
            </WalletContextProvider>
          </WalletProvider>
        </SuiClientProvider>
      </NetworkProvider>
    </QueryClientProvider>
  );
}

// Wallet hook
export function useSuiWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useSuiWallet must be used within a SuiWalletProvider');
  }
  return context;
}

// Wallet adapter hook - now uses context
export function useWalletAdapter(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletAdapter must be used within a SuiWalletProvider');
  }
  return context;
}


// Re-export wallet components from components directory
export { SuiWalletButton } from '@/components/sui-wallet-button';
export { SuiWalletButtonStable } from '@/components/sui-wallet-button-stable';
export { SuiWalletButtonCustom } from '@/components/sui-wallet-button-custom';
export { WalletStatus } from '@/components/wallet-status';
export { WalletDebugStatus } from '@/components/wallet-debug-status';
export { NetworkSwitcher } from '@/components/network-switcher';


// Export official components from dapp-kit
export { ConnectButton, useSuiClient, useSuiClientQuery };
