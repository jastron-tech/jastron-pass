'use client';

import { useCurrentWallet, useConnectWallet, useDisconnectWallet, useWallets } from '@mysten/dapp-kit';

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
