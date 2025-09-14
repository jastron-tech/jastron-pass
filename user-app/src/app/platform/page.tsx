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
  getJastronPassStructType,
  useContractIds,
  useNetwork,
  JASTRON_PASS,
  createContract,
  getSuiStructType,
  getGenericStructType,
  SUI,
} from '@/lib/sui';
import { AccountSwitcher } from '@/components/account-switcher';
import { NetworkSwitcher } from '@/context/wallet-adapter';
import { bcs } from '@mysten/bcs';



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
  if (!data || !Array.isArray(data) || data.length < 1) return null;
  
  const priceLimitBp = BigInt(bcs.u64().parse(new Uint8Array(data[0][0] as number[])));
  
  // If both values are 0, it means the rule is not set
  if (priceLimitBp === BigInt(0)) return null;
  
  return {
    price_limit_bp: Number(priceLimitBp)
  };
};


export default function PlatformPage() {
  const { connected, address, signAndExecuteTransactionBlock } = useWalletAdapter();
  const { latestPackageId, platformId, publisherId } = useContractIds();
  const { currentNetwork } = useNetwork();
  
  // State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  
  // Transfer policy cap management
  const [transferPolicyCap, setTransferPolicyCap] = useState<TransferPolicyCap | null>(null);
  const [policyConfig, setPolicyConfig] = useState<TransferPolicyConfig | null>(null);
  
  // Royalty fee rule form
  const [royaltyFeeBp, setRoyaltyFeeBp] = useState<string>('');
  const [royaltyMinFee, setRoyaltyMinFee] = useState<string>('');
  
  // Resell price limit rule form
  const [resellPriceLimitBp, setResellPriceLimitBp] = useState<string>('');
  
  // Platform fee rule form
  const [platformFeeBp, setPlatformFeeBp] = useState<string>('');
  const [platformMinFee, setPlatformMinFee] = useState<string>('');

  const loadTransferPolicyCap = useCallback(async () => {
    try {
      console.log('Loading transfer policy cap from config...');
      
      // Get transfer policy cap and policy IDs from config
      const ticketTransferPolicyCapId = JASTRON_PASS[currentNetwork].TICKET_TRANSFER_POLICY_CAP_ID;
      const ticketTransferPolicyId = JASTRON_PASS[currentNetwork].TICKET_TRANSFER_POLICY_ID;
      
      // Only set if both IDs are available
      if (ticketTransferPolicyCapId && ticketTransferPolicyId) {
        const cap: TransferPolicyCap = {
          id: ticketTransferPolicyCapId,
          policyId: ticketTransferPolicyId,
          type: getSuiStructType(SUI.MODULES.TRANSFER_POLICY, getGenericStructType(SUI.STRUCTS.TRANSFER_POLICY_CAP, [getJastronPassStructType(JASTRON_PASS.MODULES.TICKET, JASTRON_PASS.STRUCTS.TICKET, currentNetwork, 'v1')])),
        };
        
        setTransferPolicyCap(cap);
        console.log('Transfer policy cap loaded from config:', cap);
      } else {
        console.log('Transfer policy cap or policy ID not configured for current network');
        setTransferPolicyCap(null);
      }
    } catch (error) {
      console.error('Failed to load transfer policy cap from config:', error);
      setTransferPolicyCap(null);
    }
  }, [currentNetwork]);

  const loadPolicyConfig = useCallback(async () => {
    if (!transferPolicyCap) return;
    
    try {
      console.log('Loading policy config...');
      const contract = createContract(currentNetwork);
      
      try {
        // Get platform fee rule
        const platformFeeResult = await contract.getPlatformFeeRuleValue(transferPolicyCap.policyId);
        const platformFeeData = platformFeeResult?.results?.[0]?.returnValues;
        const platformFeeConfig = parseConfigData(platformFeeData);
        const hasPlatformRule = !!(platformFeeConfig && platformFeeConfig.fee_bp !== undefined);
        
        // Get royalty fee rule
        const royaltyFeeResult = await contract.getRoyaltyFeeRuleValue(transferPolicyCap.policyId);
        const royaltyFeeData = royaltyFeeResult?.results?.[0]?.returnValues;
        const royaltyFeeConfig = parseConfigData(royaltyFeeData);
        const hasRoyaltyRule = !!(royaltyFeeConfig && royaltyFeeConfig.fee_bp !== undefined);
        
        // Get resell price limit rule
        const resellPriceLimitResult = await contract.getResellPriceLimitRuleValue(transferPolicyCap.policyId);
        const resellPriceLimitData = resellPriceLimitResult?.results?.[0]?.returnValues;
        const resellPriceLimitConfig = parsePriceLimitData(resellPriceLimitData);
        const hasResellPriceLimitRule = !!(resellPriceLimitConfig && resellPriceLimitConfig.price_limit_bp !== undefined);

        console.log('Platform fee config:', platformFeeConfig, platformFeeResult);
        console.log('Royalty fee config:', royaltyFeeConfig, royaltyFeeResult);
        console.log('Resell price limit config:', resellPriceLimitConfig, resellPriceLimitData);

        const config: TransferPolicyConfig = {
          policyId: transferPolicyCap.policyId,
          hasRoyaltyRule,
          hasPlatformRule,
          hasResellPriceLimitRule,
          royaltyFeeBp: hasRoyaltyRule ? royaltyFeeConfig!.fee_bp : 0,
          royaltyMinFee: hasRoyaltyRule ? royaltyFeeConfig!.min_fee : 0,
          resellPriceLimitBp: hasResellPriceLimitRule ? resellPriceLimitConfig!.price_limit_bp : 10000,
          platformFeeBp: hasPlatformRule ? platformFeeConfig!.fee_bp : 0,
          platformMinFee: hasPlatformRule ? platformFeeConfig!.min_fee : 0,
        };
        
        setPolicyConfig(config);
        console.log('Policy config loaded:', config);
      } catch (error) {
        console.warn(`Failed to load config for policy ${transferPolicyCap.policyId}:`, error);
        // Set config with default values if loading fails
        setPolicyConfig({
          policyId: transferPolicyCap.policyId,
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
    } catch (error) {
      console.error('Failed to load policy config:', error);
    }
  }, [transferPolicyCap, currentNetwork]);

  // Load platform data
  useEffect(() => {
    loadTransferPolicyCap();
  }, [loadTransferPolicyCap]);

  // Load policy config when transferPolicyCap changes
  useEffect(() => {
    if (transferPolicyCap) {
      loadPolicyConfig();
    }
  }, [transferPolicyCap, loadPolicyConfig]);

  // Transfer policy management functions

  const handleAddRoyaltyFeeRule = async () => {
    if (!connected || !address || !signAndExecuteTransactionBlock) {
      setResult('請先連接錢包');
      return;
    }

    if (!transferPolicyCap || !royaltyFeeBp || !royaltyMinFee) {
      setResult('請填寫版稅費用規則');
      return;
    }

    setLoading(true);
    try {
      const contract = createContract(currentNetwork);
      const tx = await contract.transferPolicy.addRoyaltyFeeRule(
        transferPolicyCap.policyId,
        transferPolicyCap.id,
        parseInt(royaltyFeeBp),
        parseInt(royaltyMinFee)
      );
      
      setResult('正在執行添加版稅費用規則交易...');
      const result = await signAndExecuteTransactionBlock({ transaction: tx, chain: currentNetwork });
      
      console.log('Add royalty fee rule result:', result);
      setResult(`✅ 版稅費用規則添加成功！交易: ${(result as { digest: string }).digest}`);
      
      // Refresh policy config
      setTimeout(() => {
        loadPolicyConfig();
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

    if (!transferPolicyCap || !resellPriceLimitBp) {
      setResult('請填寫轉售價格限制');
      return;
    }

    setLoading(true);
    try {
      const contract = createContract(currentNetwork);
      const tx = await contract.transferPolicy.addResellPriceLimitRule(
        transferPolicyCap.policyId,
        transferPolicyCap.id,
        parseInt(resellPriceLimitBp)
      );
      
      setResult('正在執行添加轉售價格限制規則交易...');
      const result = await signAndExecuteTransactionBlock({ transaction: tx, chain: currentNetwork });
      
      console.log('Add resell price limit rule result:', result);
      setResult(`✅ 轉售價格限制規則添加成功！交易: ${(result as { digest: string }).digest}`);
      
      // Refresh policy config
      setTimeout(() => {
        loadPolicyConfig();
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

    if (!transferPolicyCap || !platformFeeBp || !platformMinFee) {
      setResult('請填寫平台費用規則');
      return;
    }

    setLoading(true);
    try {
      const contract = createContract(currentNetwork);
      const tx = await contract.transferPolicy.addPlatformFeeRule(
        transferPolicyCap.policyId,
        transferPolicyCap.id,
        parseInt(platformFeeBp),
        parseInt(platformMinFee)
      );
      
      setResult('正在執行添加平台費用規則交易...');
      const result = await signAndExecuteTransactionBlock({ transaction: tx, chain: currentNetwork });
      
      console.log('Add platform fee rule result:', result);
      setResult(`✅ 平台費用規則添加成功！交易: ${(result as { digest: string }).digest}`);
      
      // Refresh policy config
      setTimeout(() => {
        loadPolicyConfig();
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

      <Tabs defaultValue="transfer-policy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transfer-policy">轉移政策</TabsTrigger>
        </TabsList>

        <TabsContent value="transfer-policy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>轉移政策管理</CardTitle>
              <CardDescription>
                管理票券轉移政策，包括版稅費用、轉售價格限制和平台費用規則
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transfer Policy Info */}
              {transferPolicyCap && (
                <div className="space-y-2">
                  <Label className="font-medium">當前轉移政策</Label>
                  <div className="text-sm text-muted-foreground">
                    能力對象: {formatAddress(transferPolicyCap.id)}<br/>
                    對應政策: {formatAddress(transferPolicyCap.policyId)}
                  </div>
                </div>
              )}

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
                    disabled={!connected || loading || !transferPolicyCap || !royaltyFeeBp || !royaltyMinFee}
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
                    disabled={!connected || loading || !transferPolicyCap || !resellPriceLimitBp}
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
                    disabled={!connected || loading || !transferPolicyCap || !platformFeeBp || !platformMinFee}
                    className="w-full"
                  >
                    {loading ? '添加中...' : '添加平台費用規則'}
                  </Button>
                </CardContent>
              </Card>

              {/* Current Policy Config Display */}
              {policyConfig && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">當前轉移政策配置</CardTitle>
                    <CardDescription>
                      當前轉移政策的配置信息
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            能力對象: {formatAddress(transferPolicyCap!.id)}
                          </Badge>
                          <Badge variant="default">
                            已載入
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          對應政策: {formatAddress(transferPolicyCap!.policyId)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="font-medium">版稅費用:</span>
                            <p className={policyConfig.hasRoyaltyRule ? "text-green-600" : "text-gray-400"}>
                              {policyConfig.hasRoyaltyRule 
                                ? `${policyConfig.royaltyFeeBp} 基點 (${policyConfig.royaltyFeeBp / 100}%)` 
                                : "未設置"
                              }
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">最低版稅:</span>
                            <p className={policyConfig.hasRoyaltyRule ? "text-green-600" : "text-gray-400"}>
                              {policyConfig.hasRoyaltyRule 
                                ? `${policyConfig.royaltyMinFee.toLocaleString()} MIST` 
                                : "未設置"
                              }
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">轉售限制:</span>
                            <p className={policyConfig.hasResellPriceLimitRule ? "text-green-600" : "text-gray-400"}>
                              {policyConfig.hasResellPriceLimitRule 
                                ? `${policyConfig.resellPriceLimitBp} 基點 (${policyConfig.resellPriceLimitBp / 100}%)` 
                                : "未設置"
                              }
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">平台費用:</span>
                            <p className={policyConfig.hasPlatformRule ? "text-green-600" : "text-gray-400"}>
                              {policyConfig.hasPlatformRule 
                                ? `${policyConfig.platformFeeBp} 基點 (${policyConfig.platformFeeBp / 100}%)` 
                                : "未設置"
                              }
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">最低平台費用:</span>
                            <p className={policyConfig.hasPlatformRule ? "text-green-600" : "text-gray-400"}>
                              {policyConfig.hasPlatformRule 
                                ? `${policyConfig.platformMinFee.toLocaleString()} MIST` 
                                : "未設置"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
