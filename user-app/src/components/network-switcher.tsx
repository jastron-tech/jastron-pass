'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { SUI_NETWORKS, SuiNetwork, CURRENT_NETWORK } from '@/lib/sui-config';

interface NetworkSwitcherProps {
  onNetworkChange?: (network: SuiNetwork) => void;
}

export function NetworkSwitcher({ onNetworkChange }: NetworkSwitcherProps) {
  const [currentNetwork, setCurrentNetwork] = useState<SuiNetwork>(CURRENT_NETWORK);
  const [switching, setSwitching] = useState(false);

  // Load network from localStorage on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('sui-network') as SuiNetwork;
    if (savedNetwork && SUI_NETWORKS[savedNetwork]) {
      setCurrentNetwork(savedNetwork);
    }
  }, []);

  const handleNetworkSwitch = async (network: SuiNetwork) => {
    if (network === currentNetwork) {
      return; // Already on this network
    }

    setSwitching(true);
    try {
      console.log('Switching to network:', network);
      
      // Save to localStorage
      localStorage.setItem('sui-network', network);
      
      // Update state
      setCurrentNetwork(network);
      
      // Call callback if provided
      if (onNetworkChange) {
        onNetworkChange(network);
      }
      
      console.log('Network switched to:', network);
    } catch (error) {
      console.error('Failed to switch network:', error);
    } finally {
      setSwitching(false);
    }
  };

  const getNetworkBadgeVariant = (network: SuiNetwork) => {
    switch (network) {
      case 'mainnet':
        return 'default';
      case 'testnet':
        return 'secondary';
      case 'devnet':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getNetworkDescription = (network: SuiNetwork) => {
    switch (network) {
      case 'mainnet':
        return '生產環境 - 真實資產';
      case 'testnet':
        return '測試環境 - 測試資產';
      case 'devnet':
        return '開發環境 - 開發測試';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>切換網路</CardTitle>
        <CardDescription>
          選擇要連接的 Sui 網路環境
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">可用網路:</Label>
          <div className="space-y-2">
            {Object.entries(SUI_NETWORKS).map(([key, network]) => {
              const networkKey = key as SuiNetwork;
              const isCurrent = networkKey === currentNetwork;
              
              return (
                <div
                  key={networkKey}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {networkKey === 'mainnet' ? 'M' : 
                         networkKey === 'testnet' ? 'T' : 'D'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {network.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getNetworkDescription(networkKey)}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {network.rpcUrl}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isCurrent && (
                      <Badge variant={getNetworkBadgeVariant(networkKey)}>
                        當前
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant={isCurrent ? "outline" : "default"}
                      onClick={() => handleNetworkSwitch(networkKey)}
                      disabled={switching || isCurrent}
                    >
                      {switching ? '切換中...' : 
                       isCurrent ? '當前' : '切換'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Network Status */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">當前網路狀態</p>
              <p className="text-xs text-muted-foreground">
                {SUI_NETWORKS[currentNetwork].name} - {getNetworkDescription(currentNetwork)}
              </p>
            </div>
            <Badge variant={getNetworkBadgeVariant(currentNetwork)}>
              {currentNetwork.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
