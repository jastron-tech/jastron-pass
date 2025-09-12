'use client';

import { useCurrentWallet } from '@mysten/dapp-kit';
import { useWalletAdapter } from '@/context/wallet-adapter';
import { useNetwork } from '@/context/network-context';

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
