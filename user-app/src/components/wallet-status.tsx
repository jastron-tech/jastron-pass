'use client';

import { useCurrentWallet } from '@mysten/dapp-kit';
import { useWalletAdapter } from '@/context/wallet-adapter';

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
