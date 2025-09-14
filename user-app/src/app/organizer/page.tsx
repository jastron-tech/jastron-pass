'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useWalletAdapter, 
  WalletStatus,
  createContract,
  formatAddress,
  formatBalance,
} from '@/lib/sui';
import { JASTRON_PASS, getJastronPassStructType, getPlatformId } from '@/lib/sui-config';
import { AccountSwitcher } from '@/components/account-switcher';
import { NetworkSwitcher } from '@/components/network-switcher';
import { useNetwork } from '@/context/network-context';

interface OrganizerProfile {
  id: string;
  name: string;
  treasury: string;
  created_at: number;
}

interface OrganizerCap {
  id: string;
  profile_id: string;
}


export default function OrganizerPage() {
  const { connected, address, executeTransaction, suiClient } = useWalletAdapter();
  
  // State
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [organizerCap, setOrganizerCap] = useState<OrganizerCap | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [suiBalance, setSuiBalance] = useState<string>('0');
  const [organizerName, setOrganizerName] = useState<string>('');
  const { currentNetwork } = useNetwork();
  const jastronPassContract = useMemo(() => createContract(currentNetwork), [currentNetwork]);
  
  // Activity creation form
  const [activityForm, setActivityForm] = useState({
    name: '',
    totalSupply: '',
    ticketPrice: '',
    saleEndedAt: '',
    description: '',
  });

  const loadOrganizerProfile = useCallback(async () => {
    if (!address || !suiClient) return;
    
    try {
      setLoading(true);
      console.log('Loading organizer profile for address:', address);
      
      // Step 1: Get organizer objects to find OrganizerCap
      const objects = await suiClient.getOwnedObjects({
        owner: address,
        options: {
          showContent: true,
          showType: true,
        }
      });

      console.log('organizer owned objects:', objects);

      // Step 2: Find OrganizerCap object
      const organizerCapObject = objects.data.find(obj => 
        obj.data?.type?.includes(getJastronPassStructType(JASTRON_PASS.MODULES.ORGANIZER, JASTRON_PASS.STRUCTS.ORGANIZER_CAP, currentNetwork, 'v1'))
      );

      if (!organizerCapObject?.data?.content) {
        setResult('未找到 OrganizerCap，請先註冊主辦方資料');
        return;
      }

      // Step 3: Extract profile_id from OrganizerCap and save the cap object
      const organizerCapContent = organizerCapObject.data.content as Record<string, unknown>;
      const organizerCapFields = organizerCapContent.fields as Record<string, unknown>;
      const profileId = organizerCapFields.profile_id as string;
      
      // Save the OrganizerCap object
      const cap: OrganizerCap = {
        id: organizerCapObject.data.objectId,
        profile_id: profileId
      };
      setOrganizerCap(cap);
      
      console.log('Found OrganizerCap with profile_id:', profileId);

      // Step 4: Get OrganizerProfile object using the profile_id
      const organizerProfileObject = await suiClient.getObject({
        id: profileId,
        options: {
          showContent: true,
          showType: true,
        }
      });

      if (organizerProfileObject.data?.content) {
        const content = organizerProfileObject.data.content as Record<string, unknown>;
        const fields = content.fields as Record<string, unknown>;
        const profile: OrganizerProfile = {
          id: (fields.id as Record<string, unknown>).id as string,
          name: fields.name as string || 'Unknown Organizer',
          treasury: fields.treasury as string,
          created_at: 1700000000000, // Fixed timestamp for consistent SSR
        };
        
        setOrganizerProfile(profile);
        setResult('主辦方資料載入成功');
        console.log('Loaded organizer profile:', profile);
      } else {
        setResult('未找到 OrganizerProfile 對象');
      }
    } catch (error) {
      console.error('Failed to load organizer profile:', error);
      setResult(`載入主辦方資料失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [address, suiClient, currentNetwork]);


  const loadSuiBalance = useCallback(async () => {
    if (!address || !suiClient) return;
    
    try {
      console.log('Loading SUI balance for address:', address);
      
      const balance = await suiClient.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI'
      });
      
      setSuiBalance(balance.totalBalance);
      console.log('SUI balance loaded:', balance.totalBalance);
    } catch (error) {
      console.error('Failed to load SUI balance:', error);
      setResult(`載入 SUI 餘額失敗: ${error}`);
    }
  }, [address, suiClient]);

  // Load organizer data
  useEffect(() => {
    if (connected && address) {
      loadOrganizerProfile();
      loadSuiBalance();
    }
  }, [connected, address, loadOrganizerProfile, loadSuiBalance]);

  const handleRegisterOrganizer = async () => {
    console.log('Register organizer - Wallet state:', { 
      connected, 
      address, 
      hasSignFunction: !!executeTransaction,
      executeTransaction: typeof executeTransaction
    });
    
    if (!connected) {
      setResult('請先連接錢包');
      return;
    }
    
    if (!address) {
      setResult('無法獲取錢包地址，請重新連接錢包');
      return;
    }
    
    if (!executeTransaction) {
      setResult('錢包未正確連接，請重新連接錢包');
      return;
    }

    if (!organizerName.trim()) {
      setResult('請輸入主辦方名稱');
      return;
    }

    setLoading(true);
    setResult('正在創建交易...');
    
    try {
      console.log('Creating organizer registration transaction...');
      const contract = jastronPassContract;
      const platformId = getPlatformId(currentNetwork); // Use platform ID from config
      
      setResult('正在構建交易...');
      const tx = await contract.registerOrganizerProfile(platformId, organizerName.trim(), address);
      
      setResult('正在執行交易，請稍候...');
      console.log('Executing transaction...');
      const result = await executeTransaction(tx);

      console.log('Organizer registration result:', result);
      setResult(`✅ 主辦方註冊成功！交易: ${(result as { digest: string }).digest}`);
      
      // Clear the organizer name input
      setOrganizerName('');
      
      // Reload organizer profile
      setTimeout(() => {
        loadOrganizerProfile();
      }, 2000);
    } catch (error) {
      console.error('Failed to register organizer:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(`❌ 主辦方註冊失敗: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async () => {
    if (!connected || !address || !executeTransaction || !organizerProfile || !organizerCap) {
      setResult('請先連接錢包並確認主辦方資料');
      return;
    }

    if (!activityForm.name || !activityForm.totalSupply || !activityForm.ticketPrice || !activityForm.saleEndedAt) {
      setResult('請填寫所有必要欄位');
      return;
    }

    setLoading(true);
    setResult('正在創建活動交易...');
    
    try {
      const contract = jastronPassContract;
      const platformId = getPlatformId(currentNetwork); // Get platform ID from config
      
      setResult('正在構建活動交易...');
      const tx = await contract.createActivity(
        organizerCap.id, // organizerCap object ID
        organizerProfile.id, // organizerProfile object ID
        platformId, // platform object ID
        activityForm.name, // activity name
        parseInt(activityForm.totalSupply),
        parseInt(activityForm.ticketPrice),
        new Date(activityForm.saleEndedAt).getTime()
      );
      
      setResult('正在執行活動創建交易，請稍候...');
      const result = await executeTransaction(tx);

      console.log('Activity creation result:', result);
      setResult(`✅ 活動創建成功！交易: ${(result as { digest: string }).digest}`);
      
      // Reset form
      setActivityForm({
        name: '',
        totalSupply: '',
        ticketPrice: '',
        saleEndedAt: '',
        description: '',
      });
      
      // Reload organizer profile
      setTimeout(() => {
        loadOrganizerProfile();
      }, 2000);
    } catch (error) {
      console.error('Failed to create activity:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(`❌ 活動創建失敗: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container mx-auto p-6 space-y-6">
      <WalletStatus />
      <AccountSwitcher />
      <NetworkSwitcher />

      {/* SUI Balance Card */}
      {connected && address && (
        <Card>
          <CardHeader>
            <CardTitle>錢包餘額</CardTitle>
            <CardDescription>
              當前連接地址的 SUI 餘額
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Label className="font-medium">地址:</Label>
              <Badge variant="outline">{formatAddress(address)}</Badge>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Label className="font-medium">SUI 餘額:</Label>
              <Badge variant="default" className="text-lg font-bold">
                {formatBalance(suiBalance)} SUI
              </Badge>
            </div>
            <div className="mt-2">
              <Button 
                onClick={loadSuiBalance} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? '載入中...' : '重新整理餘額'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{result}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">創建活動</TabsTrigger>
          <TabsTrigger value="profile">主辦方資料</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>創建新活動</CardTitle>
              <CardDescription>
                創建新的票券活動
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {organizerProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="activity-name">活動名稱 *</Label>
                      <Input
                        id="activity-name"
                        type="text"
                        placeholder="輸入活動名稱"
                        value={activityForm.name}
                        onChange={(e) => setActivityForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="total-supply">總票券數量 *</Label>
                      <Input
                        id="total-supply"
                        type="number"
                        placeholder="輸入總票券數量"
                        value={activityForm.totalSupply}
                        onChange={(e) => setActivityForm(prev => ({ ...prev, totalSupply: e.target.value }))}
                        min="1"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ticket-price">票價 (MIST) *</Label>
                      <Input
                        id="ticket-price"
                        type="number"
                        placeholder="輸入票價 (以 MIST 為單位)"
                        value={activityForm.ticketPrice}
                        onChange={(e) => setActivityForm(prev => ({ ...prev, ticketPrice: e.target.value }))}
                        min="1"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        1 SUI = 1,000,000,000 MIST
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sale-ended-at">銷售結束時間 *</Label>
                      <Input
                        id="sale-ended-at"
                        type="datetime-local"
                        value={activityForm.saleEndedAt}
                        onChange={(e) => setActivityForm(prev => ({ ...prev, saleEndedAt: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">活動描述 (選填)</Label>
                      <Input
                        id="description"
                        placeholder="輸入活動描述"
                        value={activityForm.description}
                        onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleCreateActivity}
                    disabled={!connected || loading || !activityForm.name || !activityForm.totalSupply || !activityForm.ticketPrice || !activityForm.saleEndedAt}
                    className="w-full"
                  >
                    {loading ? '創建中...' : '創建活動'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    您還沒有註冊主辦方資料。請先註冊主辦方，然後才能創建活動。
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="organizer-name">主辦方名稱 *</Label>
                    <Input
                      id="organizer-name"
                      type="text"
                      placeholder="輸入主辦方名稱"
                      value={organizerName}
                      onChange={(e) => setOrganizerName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      請輸入一個有意義的主辦方名稱，這將用於識別您的組織
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleRegisterOrganizer} 
                    disabled={!connected || loading || !organizerName.trim()}
                    className="w-full"
                  >
                    {loading ? '註冊中...' : '註冊主辦方'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>主辦方資料</CardTitle>
              <CardDescription>
                查看和管理您的主辦方資料
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organizerProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medium">主辦方名稱</Label>
                      <div className="text-lg font-semibold">
                        {organizerProfile.name}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">狀態</Label>
                      <Badge variant="default">已註冊</Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">主辦方ID</Label>
                      <Badge variant="outline" className="text-xs">
                        {formatAddress(organizerProfile.id)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">金庫地址</Label>
                      <Badge variant="outline" className="text-xs">
                        {formatAddress(organizerProfile.treasury)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">註冊時間</Label>
                      <div className="text-sm">
                        {new Date(organizerProfile.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    您還沒有註冊主辦方資料。請填寫主辦方名稱並點擊下方按鈕註冊。
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="organizer-name-profile">主辦方名稱 *</Label>
                    <Input
                      id="organizer-name-profile"
                      type="text"
                      placeholder="輸入主辦方名稱"
                      value={organizerName}
                      onChange={(e) => setOrganizerName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      請輸入一個有意義的主辦方名稱，這將用於識別您的組織
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleRegisterOrganizer} 
                    disabled={!connected || loading || !organizerName.trim()}
                    className="w-full"
                  >
                    {loading ? '註冊中...' : '註冊主辦方'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
