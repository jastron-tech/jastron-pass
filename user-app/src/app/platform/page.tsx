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
  getJastronPassStructType,
  useContractIds,
  useNetwork,
  JASTRON_PASS,
  createContract,
  getSuiStructType,
  getGenericStructType,
  getPublisherId,
  SUI,
} from '@/lib/sui';
import { AccountSwitcher } from '@/components/account-switcher';
import { NetworkSwitcher } from '@/context/wallet-adapter';
import { bcs } from '@mysten/bcs';

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

interface TransferPolicyCap {
  id: string;
  policyId: string;
  type: string;
}

interface TransferPolicyConfig {
  policyId: string;
  hasRoyaltyRule: boolean;
  hasPlatformRule: boolean;
  hasResellPriceLimitRule: boolean;
  royaltyFeeBp: number;
  royaltyMinFee: number;
  resellPriceLimitBp: number;
  platformFeeBp: number;
  platformMinFee: number;
}

// Helper function to parse config data from Move tuple (u64, u64)
const parseConfigData = (data: [number[], string][] | undefined): { fee_bp: number; min_fee: number } | null => {
  if (!data || !Array.isArray(data) || data.length < 2) return null;
  
  const feeBp = BigInt(bcs.u64().parse(new Uint8Array(data[0][0] as number[])));
  const minFee = BigInt(bcs.u64().parse(new Uint8Array(data[1][0] as number[])));
  
  // If both values are 0, it means the rule is not set
  if (feeBp === BigInt(0) && minFee === BigInt(0)) return null;
  
  return {
    fee_bp: Number(feeBp),
    min_fee: Number(minFee)
  };
};

const parsePriceLimitData = (data: [number[], string][] | undefined): { price_limit_bp: number } | null => {
  if (!data || !Array.isArray(data) || data.length < 2) return null;
  const priceLimitBp = BigInt(bcs.u64().parse(new Uint8Array(data[0][0] as number[])));
  const priceLimitBp2 = BigInt(bcs.u64().parse(new Uint8Array(data[1][0] as number[]))); // This is the same value as data[0] in Move
  
  // If both values are 0, it means the rule is not set
  if (priceLimitBp === BigInt(0) && priceLimitBp2 === BigInt(0)) return null;
  
  return {
    price_limit_bp: Number(priceLimitBp)
  };
};


export default function PlatformPage() {
  const { connected, address, signAndExecuteTransactionBlock, suiClient } = useWalletAdapter();
  const { latestPackageId, platformId, publisherId } = useContractIds();
  const { currentNetwork } = useNetwork();
  
  // State
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [transactionRecords, setTransactionRecords] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  
  // Platform settings
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [newFeeRate, setNewFeeRate] = useState<string>('');
  
  // Transfer policy cap management
  const [transferPolicyCaps, setTransferPolicyCaps] = useState<TransferPolicyCap[]>([]);
  const [selectedPolicyCap, setSelectedPolicyCap] = useState<string>('');
  const [policyConfigs, setPolicyConfigs] = useState<TransferPolicyConfig[]>([]);
  
  // Royalty fee rule form
  const [royaltyFeeBp, setRoyaltyFeeBp] = useState<string>('');
  const [royaltyMinFee, setRoyaltyMinFee] = useState<string>('');
  
  // Resell price limit rule form
  const [resellPriceLimitBp, setResellPriceLimitBp] = useState<string>('');
  
  // Platform fee rule form
  const [platformFeeBp, setPlatformFeeBp] = useState<string>('');
  const [platformMinFee, setPlatformMinFee] = useState<string>('');

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
        obj.data?.type?.includes(getJastronPassStructType(JASTRON_PASS.MODULES.PLATFORM, JASTRON_PASS.STRUCTS.PLATFORM, currentNetwork, 'v1'))
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
  }, [address, suiClient, currentNetwork]);

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
          timestamp: 1700000000000 - 3600000, // 1 hour ago (fixed timestamp)
          description: '活動票券平台費用',
        },
        {
          id: '0x2',
          type: 'royalty_fee',
          amount: '500000000', // 0.5 SUI
          timestamp: 1700000000000 - 7200000, // 2 hours ago (fixed timestamp)
          description: '票券轉售版權費用',
        },
        {
          id: '0x3',
          type: 'platform_fee',
          amount: '2000000000', // 2 SUI
          timestamp: 1700000000000 - 86400000, // 1 day ago (fixed timestamp)
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



  const loadTransferPolicyCaps = useCallback(async () => {
    if (!address || !suiClient) return;
    
    try {
      console.log('Loading transfer policy caps...');
      
      // Get owned objects to find transfer policy caps
      const objects = await suiClient.getOwnedObjects({
        owner: address,
        options: {
          showContent: true,
          showType: true,
        }
      });

      // Find TransferPolicyCap objects
      const ticketTransferPolicyCapStruct = getGenericStructType(SUI.STRUCTS.TRANSFER_POLICY_CAP, [getJastronPassStructType(JASTRON_PASS.MODULES.TICKET, JASTRON_PASS.STRUCTS.TICKET, currentNetwork, 'v1')]);
      const transferPolicyCapStruct = getSuiStructType(SUI.MODULES.TRANSFER_POLICY, ticketTransferPolicyCapStruct);
      
      const capObjects = objects.data.filter(obj => 
        obj.data?.type?.includes(transferPolicyCapStruct)
      );

      // Load policy IDs from caps
      const caps: TransferPolicyCap[] = [];
      
      for (const obj of capObjects) {
        const capId = obj.data?.objectId;
        if (!capId) continue;

        try {
          // Get policy ID directly from object content
          if (obj.data?.content && 'fields' in obj.data.content) {
            const fields = (obj.data.content as Record<string, unknown>).fields as Record<string, string>;
            const policyId = fields.policy_id;
            
            if (policyId) {
              caps.push({
                id: capId,
                policyId: policyId,
                type: obj.data?.type || '',
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to get policy ID from cap ${capId}:`, error);
        }
      }
      
      setTransferPolicyCaps(caps);
      console.log('Transfer policy caps loaded:', caps);
    } catch (error) {
      console.error('Failed to load transfer policy caps:', error);
    }
  }, [address, suiClient, currentNetwork]);

  const loadPolicyConfigs = useCallback(async () => {
    if (!transferPolicyCaps.length) return;
    
    try {
      console.log('Loading policy configs...');
      const contract = createContract(currentNetwork);
      const configs: TransferPolicyConfig[] = [];
      
      for (const cap of transferPolicyCaps) {
        try {
          // Get platform fee rule
          const platformFeeResult = await contract.getPlatformFeeRuleValue(cap.policyId);
          const platformFeeData = platformFeeResult?.results?.[0]?.returnValues;
          const platformFeeConfig = parseConfigData(platformFeeData);
          const hasPlatformRule = !!(platformFeeConfig && platformFeeConfig.fee_bp !== undefined);
          
          // Get royalty fee rule
          const royaltyFeeResult = await contract.getRoyaltyFeeRuleValue(cap.policyId);
          const royaltyFeeData = royaltyFeeResult?.results?.[0]?.returnValues;
          const royaltyFeeConfig = parseConfigData(royaltyFeeData);
          const hasRoyaltyRule = !!(royaltyFeeConfig && royaltyFeeConfig.fee_bp !== undefined);
          
          // Get resell price limit rule
          const resellPriceLimitResult = await contract.getResellPriceLimitRuleValue(cap.policyId);
          const resellPriceLimitData = resellPriceLimitResult?.results?.[0]?.returnValues;
          const resellPriceLimitConfig = parsePriceLimitData(resellPriceLimitData);
          const hasResellPriceLimitRule = !!(resellPriceLimitConfig && resellPriceLimitConfig.price_limit_bp !== undefined);

          console.log('Platform fee config:', platformFeeConfig, platformFeeResult);
          console.log('Royalty fee config:', royaltyFeeConfig, royaltyFeeResult);
          console.log('Resell price limit config:', resellPriceLimitConfig, resellPriceLimitResult);

          const config: TransferPolicyConfig = {
            policyId: cap.policyId,
            hasRoyaltyRule,
            hasPlatformRule,
            hasResellPriceLimitRule,
            royaltyFeeBp: hasRoyaltyRule ? royaltyFeeConfig!.fee_bp : 0,
            royaltyMinFee: hasRoyaltyRule ? royaltyFeeConfig!.min_fee : 0,
            resellPriceLimitBp: hasResellPriceLimitRule ? resellPriceLimitConfig!.price_limit_bp : 10000,
            platformFeeBp: hasPlatformRule ? platformFeeConfig!.fee_bp : 0,
            platformMinFee: hasPlatformRule ? platformFeeConfig!.min_fee : 0,
          };
          
          configs.push(config);
        } catch (error) {
          console.warn(`Failed to load config for policy ${cap.policyId}:`, error);
          // Add config with default values if loading fails
          configs.push({
            policyId: cap.policyId,
            hasRoyaltyRule: false,
            hasPlatformRule: false,
            hasResellPriceLimitRule: false,
            royaltyFeeBp: 0,
            royaltyMinFee: 0,
            resellPriceLimitBp: 10000,
            platformFeeBp: 0,
            platformMinFee: 0,
          });
        }
      }
      
      setPolicyConfigs(configs);
      console.log('Policy configs loaded:', configs);
    } catch (error) {
      console.error('Failed to load policy configs:', error);
    }
  }, [transferPolicyCaps, currentNetwork]);

  // Load platform data
  useEffect(() => {
    if (connected && address) {
      loadPlatformInfo();
      loadPlatformStats();
      loadTransactionRecords();
      loadTransferPolicyCaps();
    }
  }, [connected, address, loadPlatformInfo, loadPlatformStats, loadTransactionRecords, loadTransferPolicyCaps]);

  // Load policy configs when transferPolicyCaps change
  useEffect(() => {
    if (transferPolicyCaps.length > 0) {
      loadPolicyConfigs();
    }
  }, [transferPolicyCaps, loadPolicyConfigs]);

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
        loadTransferPolicyCaps(),
      ]);
      setResult('平台資料已重新整理');
    } catch (error) {
      setResult(`重新整理失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Transfer policy management functions
  const handleCreateNewPolicy = async () => {
    if (!connected || !address || !signAndExecuteTransactionBlock) {
      setResult('請先連接錢包');
      return;
    }

    setLoading(true);
    try {
      const contract = createContract(currentNetwork);
      const publisherId = getPublisherId(currentNetwork);
      const tx = await contract.transferPolicy.newPolicy(publisherId);
      
      setResult('正在執行創建轉移政策交易...');
      const result = await signAndExecuteTransactionBlock({ transaction: tx, chain: currentNetwork });
      
      console.log('Create policy result:', result);
      setResult(`✅ 轉移政策創建成功！交易: ${(result as { digest: string }).digest}`);
      
      // Refresh transfer policy caps
      setTimeout(() => {
        loadTransferPolicyCaps();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to create policy:', error);
      setResult(`❌ 創建轉移政策失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoyaltyFeeRule = async () => {
    if (!connected || !address || !signAndExecuteTransactionBlock) {
      setResult('請先連接錢包');
      return;
    }

    if (!selectedPolicyCap || !royaltyFeeBp || !royaltyMinFee) {
      setResult('請選擇能力對象並填寫版稅費用規則');
      return;
    }

    // Get the corresponding policy ID from the selected cap
    const selectedCap = transferPolicyCaps.find(cap => cap.id === selectedPolicyCap);
    if (!selectedCap) {
      setResult('找不到選中的能力對象');
      return;
    }

    setLoading(true);
    try {
      const contract = createContract(currentNetwork);
      const tx = await contract.transferPolicy.addRoyaltyFeeRule(
        selectedCap.policyId, // Use the policy ID from the cap
        selectedPolicyCap,    // Use the cap ID
        parseInt(royaltyFeeBp),
        parseInt(royaltyMinFee)
      );
      
      setResult('正在執行添加版稅費用規則交易...');
      const result = await signAndExecuteTransactionBlock({ transaction: tx, chain: currentNetwork });
      
      console.log('Add royalty fee rule result:', result);
      setResult(`✅ 版稅費用規則添加成功！交易: ${(result as { digest: string }).digest}`);
      
      // Refresh policy configs
      setTimeout(() => {
        loadPolicyConfigs();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to add royalty fee rule:', error);
      setResult(`❌ 添加版稅費用規則失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResellPriceLimitRule = async () => {
    if (!connected || !address || !signAndExecuteTransactionBlock) {
      setResult('請先連接錢包');
      return;
    }

    if (!selectedPolicyCap || !resellPriceLimitBp) {
      setResult('請選擇能力對象並填寫轉售價格限制');
      return;
    }

    // Get the corresponding policy ID from the selected cap
    const selectedCap = transferPolicyCaps.find(cap => cap.id === selectedPolicyCap);
    if (!selectedCap) {
      setResult('找不到選中的能力對象');
      return;
    }

    setLoading(true);
    try {
      const contract = createContract(currentNetwork);
      const tx = await contract.transferPolicy.addResellPriceLimitRule(
        selectedCap.policyId, // Use the policy ID from the cap
        selectedPolicyCap,    // Use the cap ID
        parseInt(resellPriceLimitBp)
      );
      
      setResult('正在執行添加轉售價格限制規則交易...');
      const result = await signAndExecuteTransactionBlock({ transaction: tx, chain: currentNetwork });
      
      console.log('Add resell price limit rule result:', result);
      setResult(`✅ 轉售價格限制規則添加成功！交易: ${(result as { digest: string }).digest}`);
      
      // Refresh policy configs
      setTimeout(() => {
        loadPolicyConfigs();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to add resell price limit rule:', error);
      setResult(`❌ 添加轉售價格限制規則失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlatformFeeRule = async () => {
    if (!connected || !address || !signAndExecuteTransactionBlock) {
      setResult('請先連接錢包');
      return;
    }

    if (!selectedPolicyCap || !platformFeeBp || !platformMinFee) {
      setResult('請選擇能力對象並填寫平台費用規則');
      return;
    }

    // Get the corresponding policy ID from the selected cap
    const selectedCap = transferPolicyCaps.find(cap => cap.id === selectedPolicyCap);
    if (!selectedCap) {
      setResult('找不到選中的能力對象');
      return;
    }

    setLoading(true);
    try {
      const contract = createContract(currentNetwork);
      const tx = await contract.transferPolicy.addPlatformFeeRule(
        selectedCap.policyId, // Use the policy ID from the cap
        selectedPolicyCap,    // Use the cap ID
        parseInt(platformFeeBp),
        parseInt(platformMinFee)
      );
      
      setResult('正在執行添加平台費用規則交易...');
      const result = await signAndExecuteTransactionBlock({ transaction: tx, chain: currentNetwork });
      
      console.log('Add platform fee rule result:', result);
      setResult(`✅ 平台費用規則添加成功！交易: ${(result as { digest: string }).digest}`);
      
      // Refresh policy configs
      setTimeout(() => {
        loadPolicyConfigs();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to add platform fee rule:', error);
      setResult(`❌ 添加平台費用規則失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <WalletStatus />
      <AccountSwitcher />
      <NetworkSwitcher />

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
              {currentNetwork}
            </Badge>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            錢包地址: {address ? formatAddress(address) : '未連接'}
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Package ID:</span> {formatAddress(latestPackageId)}
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Platform ID:</span> {formatAddress(platformId)}
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Publisher ID:</span> {formatAddress(publisherId)}
            </div>
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
          <TabsTrigger value="transfer-policy">轉移政策</TabsTrigger>
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

        <TabsContent value="transfer-policy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>轉移政策管理</CardTitle>
              <CardDescription>
                管理票券轉移政策，包括版稅費用、轉售價格限制和平台費用規則
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* TransferPolicyCap Selection */}
              <div className="space-y-2">
                <Label className="font-medium">選擇轉移政策能力對象</Label>
                <div className="flex gap-2">
                  <select
                    value={selectedPolicyCap}
                    onChange={(e) => setSelectedPolicyCap(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">選擇一個能力對象</option>
                    {transferPolicyCaps.map((cap) => (
                      <option key={cap.id} value={cap.id}>
                        {formatAddress(cap.id)} → {formatAddress(cap.policyId)}
                      </option>
                    ))}
                  </select>
                  <Button 
                    onClick={loadTransferPolicyCaps} 
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? '載入中...' : '重新整理'}
                  </Button>
                </div>
                {selectedPolicyCap && (
                  <div className="text-sm text-muted-foreground">
                    能力對象: {formatAddress(selectedPolicyCap)}<br/>
                    對應政策: {formatAddress(transferPolicyCaps.find(cap => cap.id === selectedPolicyCap)?.policyId || '')}
                  </div>
                )}
              </div>


              {/* Create New Policy */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">創建新轉移政策</CardTitle>
                  <CardDescription>
                    為發布者創建新的轉移政策
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-medium">發布者地址</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {formatAddress(getPublisherId(currentNetwork))}
                      </Badge>
                      <Button 
                        onClick={handleCreateNewPolicy}
                        disabled={!connected || loading}
                      >
                        {loading ? '創建中...' : '創建政策'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      將使用當前網路的發布者地址創建轉移政策
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Royalty Fee Rule */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">版稅費用規則</CardTitle>
                  <CardDescription>
                    設置票券轉售時的版稅費用比例和最低費用
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="royalty-fee-bp">版稅費用比例 (基點)</Label>
                      <Input
                        id="royalty-fee-bp"
                        type="number"
                        placeholder="250 (2.5%)"
                        value={royaltyFeeBp}
                        onChange={(e) => setRoyaltyFeeBp(e.target.value)}
                        min="0"
                        max="10000"
                      />
                      <p className="text-xs text-muted-foreground">
                        1 基點 = 0.01%，250 基點 = 2.5%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="royalty-min-fee">最低版稅費用 (MIST)</Label>
                      <Input
                        id="royalty-min-fee"
                        type="number"
                        placeholder="1000000 (0.001 SUI)"
                        value={royaltyMinFee}
                        onChange={(e) => setRoyaltyMinFee(e.target.value)}
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        1 SUI = 1,000,000,000 MIST
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddRoyaltyFeeRule}
                    disabled={!connected || loading || !selectedPolicyCap || !royaltyFeeBp || !royaltyMinFee}
                    className="w-full"
                  >
                    {loading ? '添加中...' : '添加版稅費用規則'}
                  </Button>
                </CardContent>
              </Card>

              {/* Resell Price Limit Rule */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">轉售價格限制規則</CardTitle>
                  <CardDescription>
                    設置票券轉售時的最高價格限制
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resell-price-limit-bp">轉售價格限制 (基點)</Label>
                    <Input
                      id="resell-price-limit-bp"
                      type="number"
                      placeholder="10000 (100%)"
                      value={resellPriceLimitBp}
                      onChange={(e) => setResellPriceLimitBp(e.target.value)}
                      min="0"
                      max="10000"
                    />
                    <p className="text-xs text-muted-foreground">
                      10000 基點 = 100% (無限制)，5000 基點 = 50% (最高為原價的50%)
                    </p>
                  </div>
                  <Button 
                    onClick={handleAddResellPriceLimitRule}
                    disabled={!connected || loading || !selectedPolicyCap || !resellPriceLimitBp}
                    className="w-full"
                  >
                    {loading ? '添加中...' : '添加轉售價格限制規則'}
                  </Button>
                </CardContent>
              </Card>

              {/* Platform Fee Rule */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">平台費用規則</CardTitle>
                  <CardDescription>
                    設置平台從票券交易中收取的費用比例和最低費用
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="platform-fee-bp">平台費用比例 (基點)</Label>
                      <Input
                        id="platform-fee-bp"
                        type="number"
                        placeholder="500 (5%)"
                        value={platformFeeBp}
                        onChange={(e) => setPlatformFeeBp(e.target.value)}
                        min="0"
                        max="10000"
                      />
                      <p className="text-xs text-muted-foreground">
                        1 基點 = 0.01%，500 基點 = 5%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="platform-min-fee">最低平台費用 (MIST)</Label>
                      <Input
                        id="platform-min-fee"
                        type="number"
                        placeholder="1000000 (0.001 SUI)"
                        value={platformMinFee}
                        onChange={(e) => setPlatformMinFee(e.target.value)}
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        1 SUI = 1,000,000,000 MIST
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddPlatformFeeRule}
                    disabled={!connected || loading || !selectedPolicyCap || !platformFeeBp || !platformMinFee}
                    className="w-full"
                  >
                    {loading ? '添加中...' : '添加平台費用規則'}
                  </Button>
                </CardContent>
              </Card>

              {/* Current Policy Caps Display */}
              {transferPolicyCaps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">當前轉移政策配置</CardTitle>
                    <CardDescription>
                      您擁有的轉移政策能力對象及其配置信息
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {transferPolicyCaps.map((cap) => {
                        const config = policyConfigs.find(c => c.policyId === cap.policyId);
                        return (
                          <div key={cap.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                能力對象: {formatAddress(cap.id)}
                              </Badge>
                              <Badge variant={selectedPolicyCap === cap.id ? "default" : "outline"}>
                                {selectedPolicyCap === cap.id ? "已選擇" : "未選擇"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              對應政策: {formatAddress(cap.policyId)}
                            </div>
                            
                            {config && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">版稅費用:</span>
                                  <p className={config.hasRoyaltyRule ? "text-green-600" : "text-gray-400"}>
                                    {config.hasRoyaltyRule 
                                      ? `${config.royaltyFeeBp} 基點 (${config.royaltyFeeBp / 100}%)` 
                                      : "未設置"
                                    }
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">最低版稅:</span>
                                  <p className={config.hasRoyaltyRule ? "text-green-600" : "text-gray-400"}>
                                    {config.hasRoyaltyRule 
                                      ? `${config.royaltyMinFee.toLocaleString()} MIST` 
                                      : "未設置"
                                    }
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">轉售限制:</span>
                                  <p className={config.hasResellPriceLimitRule ? "text-green-600" : "text-gray-400"}>
                                    {config.hasResellPriceLimitRule 
                                      ? `${config.resellPriceLimitBp} 基點 (${config.resellPriceLimitBp / 100}%)` 
                                      : "未設置"
                                    }
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">平台費用:</span>
                                  <p className={config.hasPlatformRule ? "text-green-600" : "text-gray-400"}>
                                    {config.hasPlatformRule 
                                      ? `${config.platformFeeBp} 基點 (${config.platformFeeBp / 100}%)` 
                                      : "未設置"
                                    }
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
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
