'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useWalletAdapter, 
  WalletStatus,
  formatAddress,
  formatBalance,
  CURRENT_NETWORK,
} from '@/lib/sui';

interface PlatformInfo {
  id: string;
  treasury: string;
  balance: string;
}

interface PlatformStats {
  totalActivities: number;
  totalTicketsSold: number;
  totalRevenue: string;
  platformFeeRate: number;
}

interface TransactionRecord {
  id: string;
  type: 'platform_fee' | 'royalty_fee' | 'withdrawal';
  amount: string;
  timestamp: number;
  description: string;
}

export default function PlatformPage() {
  const { connected, address, signAndExecuteTransactionBlock, suiClient } = useWalletAdapter();
  
  // State
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [transactionRecords, setTransactionRecords] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  
  // Platform settings
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [newFeeRate, setNewFeeRate] = useState<string>('');

  const loadPlatformInfo = useCallback(async () => {
    if (!address || !suiClient) return;
    
    try {
      setLoading(true);
      console.log('Loading platform info for address:', address);
      
      // Get platform objects
      const objects = await suiClient.getOwnedObjects({
        owner: address,
        options: {
          showContent: true,
          showType: true,
        }
      });

      // Find Platform object
      const platformObject = objects.data.find(obj => 
        obj.data?.type?.includes('jastron_pass::platform::Platform')
      );

      if (platformObject?.data?.content) {
        const content = platformObject.data.content as Record<string, unknown>;
        const fields = content.fields as Record<string, unknown>;
        const platform: PlatformInfo = {
          id: ((fields.id as Record<string, unknown>).id as string),
          treasury: fields.treasury as string,
          balance: '0', // Will be updated separately
        };
        
        // Get platform balance
        const balance = await suiClient.getBalance({
          owner: platform.treasury,
          coinType: '0x2::sui::SUI'
        });
        platform.balance = balance.totalBalance;
        
        setPlatformInfo(platform);
        setResult('平台資訊載入成功');
      } else {
        setResult('未找到平台資訊，請確認您有平台權限');
      }
    } catch (error) {
      console.error('Failed to load platform info:', error);
      setResult(`載入平台資訊失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [address, suiClient]);

  const loadPlatformStats = useCallback(async () => {
    if (!suiClient) return;
    
    try {
      console.log('Loading platform stats...');
      
      // For demo purposes, create mock stats
      // In a real app, you'd query events and calculate these
      const mockStats: PlatformStats = {
        totalActivities: 15,
        totalTicketsSold: 342,
        totalRevenue: '12500000000', // 12.5 SUI in MIST
        platformFeeRate: 5,
      };
      
      setPlatformStats(mockStats);
      console.log('Platform stats loaded:', mockStats);
    } catch (error) {
      console.error('Failed to load platform stats:', error);
      setResult(`載入平台統計失敗: ${error}`);
    }
  }, [suiClient]);

  const loadTransactionRecords = useCallback(async () => {
    if (!suiClient) return;
    
    try {
      console.log('Loading transaction records...');
      
      // For demo purposes, create mock transaction records
      const mockRecords: TransactionRecord[] = [
        {
          id: '0x1',
          type: 'platform_fee',
          amount: '1000000000', // 1 SUI
          timestamp: Date.now() - 3600000, // 1 hour ago
          description: '活動票券平台費用',
        },
        {
          id: '0x2',
          type: 'royalty_fee',
          amount: '500000000', // 0.5 SUI
          timestamp: Date.now() - 7200000, // 2 hours ago
          description: '票券轉售版權費用',
        },
        {
          id: '0x3',
          type: 'platform_fee',
          amount: '2000000000', // 2 SUI
          timestamp: Date.now() - 86400000, // 1 day ago
          description: '大型活動平台費用',
        },
      ];
      
      setTransactionRecords(mockRecords);
      console.log('Transaction records loaded:', mockRecords);
    } catch (error) {
      console.error('Failed to load transaction records:', error);
      setResult(`載入交易記錄失敗: ${error}`);
    }
  }, [suiClient]);

  // Load platform data
  useEffect(() => {
    if (connected && address) {
      loadPlatformInfo();
      loadPlatformStats();
      loadTransactionRecords();
    }
  }, [connected, address, loadPlatformInfo, loadPlatformStats, loadTransactionRecords]);

  const handleWithdrawFunds = async () => {
    if (!connected || !address || !signAndExecuteTransactionBlock || !platformInfo) {
      setResult('請先連接錢包並確認平台資訊');
      return;
    }

    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      setResult('請輸入有效的提取金額');
      return;
    }

    setLoading(true);
    try {
      // For demo purposes, show a message
      // In a real app, you'd create a transaction to withdraw funds
      setResult(`提取功能需要更多實作。提取金額: ${withdrawalAmount} SUI`);
      
      // TODO: Implement actual withdrawal transaction
      // const txb = new TransactionBlock();
      // txb.transferObjects([...], address);
      // const result = await signAndExecuteTransactionBlock({ transactionBlock: txb });
      
    } catch (error) {
      console.error('Failed to withdraw funds:', error);
      setResult(`提取資金失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeeRate = async () => {
    if (!connected || !address || !signAndExecuteTransactionBlock) {
      setResult('請先連接錢包');
      return;
    }

    if (!newFeeRate || parseFloat(newFeeRate) < 0 || parseFloat(newFeeRate) > 100) {
      setResult('請輸入有效的費用率 (0-100%)');
      return;
    }

    setLoading(true);
    try {
      // For demo purposes, show a message
      setResult(`費用率更新功能需要更多實作。新費用率: ${newFeeRate}%`);
      
      // TODO: Implement actual fee rate update
      // This would involve updating the transfer policy
      
    } catch (error) {
      console.error('Failed to update fee rate:', error);
      setResult(`更新費用率失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPlatformInfo(),
        loadPlatformStats(),
        loadTransactionRecords(),
      ]);
      setResult('平台資料已重新整理');
    } catch (error) {
      setResult(`重新整理失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <WalletStatus />

      {/* Network Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>網路狀態</CardTitle>
          <CardDescription>
            當前連接的 Sui 網路資訊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Label className="font-medium">當前網路:</Label>
            <Badge variant="outline" className="capitalize">
              {CURRENT_NETWORK}
            </Badge>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            錢包地址: {address ? formatAddress(address) : '未連接'}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{result}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">儀表板</TabsTrigger>
          <TabsTrigger value="treasury">金庫管理</TabsTrigger>
          <TabsTrigger value="settings">平台設定</TabsTrigger>
          <TabsTrigger value="transactions">交易記錄</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平台金庫</CardTitle>
                <Badge variant="outline">SUI</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {platformInfo ? formatBalance(platformInfo.balance) : '0'} SUI
                </div>
                <p className="text-xs text-muted-foreground">
                  當前餘額
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">總活動數</CardTitle>
                <Badge variant="outline">活動</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {platformStats?.totalActivities || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  已創建活動
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">總票券銷售</CardTitle>
                <Badge variant="outline">票券</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {platformStats?.totalTicketsSold || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  已售出票券
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">總收入</CardTitle>
                <Badge variant="outline">SUI</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {platformStats ? formatBalance(platformStats.totalRevenue) : '0'} SUI
                </div>
                <p className="text-xs text-muted-foreground">
                  平台費用收入
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>平台資訊</CardTitle>
              <CardDescription>
                平台基本資訊和權限狀態
              </CardDescription>
            </CardHeader>
            <CardContent>
              {platformInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medium">平台ID</Label>
                      <Badge variant="outline" className="text-xs">
                        {formatAddress(platformInfo.id)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">金庫地址</Label>
                      <Badge variant="outline" className="text-xs">
                        {formatAddress(platformInfo.treasury)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">當前餘額</Label>
                      <div className="text-lg font-semibold">
                        {formatBalance(platformInfo.balance)} SUI
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">平台費用率</Label>
                      <div className="text-lg font-semibold">
                        {platformStats?.platformFeeRate || 0}%
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  未找到平台資訊，請確認您有平台管理權限
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treasury" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>金庫管理</CardTitle>
              <CardDescription>
                管理平台金庫資金和提取功能
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">當前金庫餘額</Label>
                <div className="text-3xl font-bold text-green-600">
                  {platformInfo ? formatBalance(platformInfo.balance) : '0'} SUI
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-amount">提取金額 (SUI)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="withdrawal-amount"
                      type="number"
                      placeholder="輸入提取金額"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      min="0"
                      step="0.001"
                    />
                    <Button 
                      onClick={handleWithdrawFunds}
                      disabled={!connected || loading || !withdrawalAmount}
                    >
                      {loading ? '提取中...' : '提取資金'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>平台設定</CardTitle>
              <CardDescription>
                配置平台費用率和相關設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">當前平台費用率</Label>
                <div className="text-2xl font-bold">
                  {platformStats?.platformFeeRate || 0}%
                </div>
                <p className="text-sm text-muted-foreground">
                  平台從每筆票券交易中收取的費用比例
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-fee-rate">新費用率 (%)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-fee-rate"
                      type="number"
                      placeholder="輸入新費用率 (0-100)"
                      value={newFeeRate}
                      onChange={(e) => setNewFeeRate(e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <Button 
                      onClick={handleUpdateFeeRate}
                      disabled={!connected || loading || !newFeeRate}
                    >
                      {loading ? '更新中...' : '更新費用率'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>交易記錄</CardTitle>
              <CardDescription>
                查看平台相關的交易記錄和費用收取
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={handleRefreshData} 
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? '載入中...' : '重新整理記錄'}
                </Button>
                
                {transactionRecords.length > 0 ? (
                  <div className="space-y-4">
                    {transactionRecords.map((record) => (
                      <Card key={record.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  record.type === 'platform_fee' ? 'default' : 
                                  record.type === 'royalty_fee' ? 'secondary' : 'outline'
                                }>
                                  {record.type === 'platform_fee' ? '平台費用' :
                                   record.type === 'royalty_fee' ? '版權費用' : '提取'}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(record.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">{record.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">
                                {formatBalance(record.amount)} SUI
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    暫無交易記錄
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
