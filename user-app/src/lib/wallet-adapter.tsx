'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { WalletProvider, WalletButton, useWallet } from '@mysten/wallet-adapter-react';
import { WalletStandardAdapterProvider } from '@mysten/wallet-adapter-wallet-standard';
import { SuiWalletAdapter } from '@mysten/wallet-adapter-sui-wallet';
import { UnsafeBurnerWalletAdapter } from '@mysten/wallet-adapter-unsafe-burner';
import { WalletAdapter } from '@mysten/wallet-adapter-base';

// Wallet context
interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  disconnect: () => Promise<void>;
  signAndExecuteTransactionBlock: (transactionBlock: any) => Promise<any>;
}

const WalletContext = createContext<WalletContextType | null>(null);

// Wallet provider component
export function SuiWalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [
      new SuiWalletAdapter(),
      new UnsafeBurnerWalletAdapter(),
    ],
    []
  );

  return (
    <WalletStandardAdapterProvider>
      <WalletProvider
        wallets={wallets}
        autoConnect={true}
        storageKey="sui-wallet-adapter"
      >
        {children}
      </WalletProvider>
    </WalletStandardAdapterProvider>
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
  const wallet = useWallet();
  
  return useMemo(() => ({
    connected: wallet.connected,
    connecting: wallet.connecting,
    address: wallet.address,
    disconnect: wallet.disconnect,
    signAndExecuteTransactionBlock: wallet.signAndExecuteTransactionBlock,
  }), [wallet]);
}

// Wallet button component
export function SuiWalletButton() {
  return (
    <WalletButton
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
    />
  );
}

// Wallet status component
export function WalletStatus() {
  const { connected, connecting, address } = useWalletAdapter();
  
  if (connecting) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span className="text-sm">Connecting...</span>
      </div>
    );
  }
  
  if (connected && address) {
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
