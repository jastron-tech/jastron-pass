'use client';

import { useState, useEffect } from 'react';
import { useWalletAdapter } from '@/lib/wallet-adapter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { formatAddress } from '@/lib/sui';

export function AccountSwitcher() {
  const { connected, address, accounts, switchToAccount } = useWalletAdapter();
  const [switching, setSwitching] = useState(false);

  // Force re-render when address changes (but avoid infinite loops)
  useEffect(() => {
    if (address) {
      console.log('Address changed, forcing re-render:', address);
    }
  }, [address]);

  const handleSwitchAccount = async (account: { address: string }) => {
    if (account.address === address) {
      return; // Already on this account
    }

    setSwitching(true);
    try {
      console.log('Switching to account:', account.address);
      await switchToAccount(account);
      console.log('Account switch completed');
    } catch (error) {
      console.error('Failed to switch account:', error);
    } finally {
      setSwitching(false);
    }
  };

  if (!connected || accounts.length <= 1) {
    return null; // Don't show switcher if not connected or only one account
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>切換帳戶</CardTitle>
        <CardDescription>
          選擇要使用的錢包帳戶
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">可用帳戶:</Label>
          <div className="space-y-2">
            {accounts.map((account, index) => (
              <div
                key={account.address}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {formatAddress(account.address)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      帳戶 {index + 1}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {account.address === address && (
                    <Badge variant="default">當前</Badge>
                  )}
                  <Button
                    size="sm"
                    variant={account.address === address ? "outline" : "default"}
                    onClick={() => handleSwitchAccount(account)}
                    disabled={switching || account.address === address}
                  >
                    {switching ? '切換中...' : 
                     account.address === address ? '當前' : '切換'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

