'use client';

import { SuiWalletProvider } from '@/context/wallet-adapter';
import { NetworkSwitcher } from '@/context/wallet-adapter';
import { WalletStatus } from '@/context/wallet-adapter';
import { WalletDebugStatus } from '@/context/wallet-adapter';
import { AccountSwitcher } from '@/components/account-switcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function NetworkPageContent() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">網路設定</h1>
        <p className="text-muted-foreground">
          管理你的 Sui 網路連接和錢包設定
        </p>
      </div>

      {/* Wallet Status */}
      <WalletStatus />
      <WalletDebugStatus />

      {/* Account Switcher */}
      <AccountSwitcher />

      {/* Network Switcher */}
      <NetworkSwitcher />

      {/* Network Information */}
      <Card>
        <CardHeader>
          <CardTitle>網路資訊</CardTitle>
          <CardDescription>
            當前網路環境的詳細資訊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-sm mb-2">Mainnet</h3>
                <p className="text-xs text-muted-foreground mb-1">生產環境</p>
                <p className="text-xs font-mono">https://fullnode.mainnet.sui.io:443</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-sm mb-2">Testnet</h3>
                <p className="text-xs text-muted-foreground mb-1">測試環境</p>
                <p className="text-xs font-mono">https://fullnode.testnet.sui.io:443</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-sm mb-2">Devnet</h3>
                <p className="text-xs text-muted-foreground mb-1">開發環境</p>
                <p className="text-xs font-mono">https://fullnode.devnet.sui.io:443</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NetworkPage() {
  return (
    <SuiWalletProvider>
      <NetworkPageContent />
    </SuiWalletProvider>
  );
}
