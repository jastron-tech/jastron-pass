'use client';

import { createContext, useContext, ReactNode } from 'react';
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
  SuiClientProvider
} from '@mysten/dapp-kit';

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
  const wallet = useCurrentWallet();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const wallets = useWallets();
  
  return {
    connected: wallet.isConnected,
    connecting: wallet.isConnecting,
    address: wallet.currentWallet?.accounts[0]?.address || null,
    connect: () => {
      if (wallets.length > 0) {
        connect({ wallet: wallets[0] });
      }
    },
    disconnect: () => disconnect(),
    signAndExecuteTransactionBlock: (wallet.currentWallet as { signAndExecuteTransactionBlock?: (tx: unknown) => Promise<unknown> })?.signAndExecuteTransactionBlock || (() => Promise.reject('Wallet not connected')),
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
  const address = wallet.currentWallet?.accounts[0]?.address;
  
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

// Export official components from dapp-kit
export { ConnectButton, useSuiClient, useSuiClientQuery };
