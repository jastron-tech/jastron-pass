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
import { getSuiClient } from './sui-client';

// Wallet context
interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  disconnect: () => Promise<void>;
  signAndExecuteTransactionBlock: (transactionBlock: unknown) => Promise<unknown>;
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
            {children}
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

// Wallet adapter hook
export function useWalletAdapter() {
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
    if (accounts && accounts.length > 0 && !currentAccountAddress) {
      // Set the first account as default if no current account is set
      setCurrentAccountAddress(accounts[0].address);
      console.log('Initialized current account:', accounts[0].address);
    }
  }, [accounts, currentAccountAddress]);
  
  // Log accounts changes
  useEffect(() => {
    console.log('Accounts updated:', {
      accountsCount: accounts?.length || 0,
      currentAccount: currentAccountAddress,
      allAccounts: accounts?.map(acc => acc.address) || []
    });
  }, [accounts, currentAccountAddress]);
  
  // Get signAndExecuteTransactionBlock from the wallet's features
  const signAndExecuteTransactionBlock = ({
    transaction,
    chain
  }: {
    transaction: Transaction;
    chain: string;
  }): Promise<{
    digest: string;
    effects: string;
  }> => {
    return new Promise((resolve, reject) => {
      signAndExecuteTransaction({
        transaction: transaction,
        chain: `sui:${chain}`,
      }, {
        onSuccess: (result) => {
          resolve(result);
        },
        onError: (error) => {
          reject(error);
        }
      });
    });
  };
  
  // Helper function to execute transactions using the wallet's signAndExecuteTransactionBlock method
  const executeTransaction = async (transaction: Transaction) => {
    if (!wallet.currentWallet) {
      throw new Error('錢包未連接');
    }
    
    if (!signAndExecuteTransactionBlock) {
      throw new Error('錢包不支援交易簽名功能');
    }
    
    // Use the wallet's signAndExecuteTransactionBlock method
    const result = await signAndExecuteTransactionBlock({
      transaction: transaction,
      chain: currentNetwork,
    });
    console.log('交易结果:', result);
    return result;
  };

  // Helper function to switch account
  const switchToAccount = (account: { address: string }) => {
    return new Promise((resolve, reject) => {
      console.log('Attempting to switch to account:', account.address);
      console.log('Current wallet before switch:', wallet.currentWallet?.accounts?.[0]?.address);
      
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
  const currentAddress = currentAccountAddress;
  
  // Debug logging
  console.log('Wallet adapter debug:', {
    isConnected: wallet.isConnected,
    currentWallet: wallet.currentWallet?.name,
    accountsCount: accounts?.length || 0,
    currentAccount: currentAccountAddress,
    currentAddress,
    allAccounts: accounts?.map(acc => acc.address) || []
  });

  return {
    connected: wallet.isConnected,
    connecting: wallet.isConnecting,
    address: currentAddress,
    accounts: accounts || [],
    connect: () => {
      if (wallets.length > 0) {
        connect({ wallet: wallets[0] });
      }
    },
    disconnect: () => disconnect(),
    switchToAccount,
    signAndExecuteTransactionBlock: signAndExecuteTransactionBlock || undefined,
    executeTransaction,
    suiClient,
  };
}

// Wallet button component using official ConnectButton
export function SuiWalletButton() {
  return (
    <ConnectButton 
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      connectText="Connect Wallet"
    />
  );
}

// Stable wallet button component (recommended)
export function SuiWalletButtonStable() {
  const wallet = useCurrentWallet();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const wallets = useWallets();
  
  const handleClick = () => {
    if (wallet.isConnected) {
      disconnect();
    } else {
      if (wallets.length > 0) {
        connect({ wallet: wallets[0] });
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={wallet.isConnecting}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
    >
      {wallet.isConnecting ? 'Connecting...' : wallet.isConnected ? 'Disconnect' : 'Connect Wallet'}
    </button>
  );
}

// Alternative wallet button component
export function SuiWalletButtonCustom() {
  const wallet = useCurrentWallet();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const wallets = useWallets();
  
  const handleClick = async () => {
    try {
      if (wallet.isConnected) {
        disconnect();
      } else {
        if (wallets.length > 0) {
          connect({ wallet: wallets[0] });
        }
      }
    } catch (error) {
      console.error('Wallet operation failed:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={wallet.isConnecting}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
    >
      {wallet.isConnecting ? 'Connecting...' : wallet.isConnected ? 'Disconnect' : 'Connect Wallet'}
    </button>
  );
}

// Wallet status component
export function WalletStatus() {
  const wallet = useCurrentWallet();
  const { address } = useWalletAdapter();
  
  if (wallet.isConnecting) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span className="text-sm">Connecting...</span>
      </div>
    );
  }
  
  if (wallet.isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="text-sm font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-red-500 rounded-full" />
      <span className="text-sm">Not connected</span>
    </div>
  );
}

// Debug wallet status component
export function WalletDebugStatus() {
  const wallet = useCurrentWallet();
  const { connected, address, signAndExecuteTransactionBlock } = useWalletAdapter();
  const { currentNetwork } = useNetwork();
  
  return (
    <div className="border border-orange-200 bg-orange-50 p-3 rounded-lg text-xs space-y-1">
      <div className="font-semibold text-orange-800">錢包調試資訊</div>
      <div>isConnected: {wallet.isConnected ? 'true' : 'false'}</div>
      <div>isConnecting: {wallet.isConnecting ? 'true' : 'false'}</div>
      <div>currentWallet: {wallet.currentWallet ? '存在' : 'null'}</div>
      <div>firstAccount: {wallet.currentWallet?.accounts?.[0]?.address || 'null'}</div>
      <div>accounts: {wallet.currentWallet?.accounts?.length || 0}</div>
      <div>address (adapter): {address || 'null'}</div>
      <div>currentNetwork: {currentNetwork}</div>
      <div>hasSignFunction: {signAndExecuteTransactionBlock !== undefined ? 'true' : 'false'}</div>
      <div>connected (adapter): {connected ? 'true' : 'false'}</div>
    </div>
  );
}

// Export official components from dapp-kit
export { ConnectButton, useSuiClient, useSuiClientQuery };
