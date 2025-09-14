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
  WalletDebugStatus,
  formatAddress,
  createContract,
  JASTRON_PASS,
  getJastronPassStructType,
  getPlatformId,
  getLatestPackageId,
  getTicketTransferPolicyId,
} from '@/lib/sui';
import { AccountSwitcher } from '@/components/account-switcher';
import { NetworkSwitcher } from '@/components/network-switcher';
import { useNetwork } from '@/context/network-context';
import { bcs } from '@mysten/bcs';

interface ListedTicket {
  id: string;
  objectId: string;
  price: number;
  activityId: string;
  activityName: string;
  ticketPrice: number;
  organizerProfileId: string;
  saleEndedAt: number;
  ticketsSold: number;
  totalSupply: number;
  royaltyFee: number;
  platformFee: number;
  totalFees: number;
  totalCost: number;
}

interface KioskInfo {
  id: string;
  capId: string;
  owner: string;
}

export default function KioskPage() {
  const { connected, address, executeTransaction, suiClient } = useWalletAdapter();
  const { currentNetwork } = useNetwork();
  
  // State
  const [kioskInfo, setKioskInfo] = useState<KioskInfo | null>(null);
  const [listedTickets, setListedTickets] = useState<ListedTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [searchKioskId, setSearchKioskId] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [selectedTicketForPurchase, setSelectedTicketForPurchase] = useState<string>('');

  const loadKioskInfo = useCallback(async () => {
    if (!address || !suiClient) return;
    
    try {
      console.log('Loading kiosk info for address:', address);
      setLoading(true);
      
      // Step 1: Get user profile to find kiosk_id
      const userObjects = await suiClient.getOwnedObjects({
        owner: address,
        options: {
          showContent: true,
          showType: true,
        }
      });

      // Find UserCap object
      const userCapObject = userObjects.data.find(obj => 
        obj.data?.type?.includes(getJastronPassStructType(JASTRON_PASS.MODULES.USER, JASTRON_PASS.STRUCTS.USER_CAP, currentNetwork, 'v1'))
      );

      if (!userCapObject?.data?.content) {
        setKioskInfo(null);
        setResult('未找到用戶資料，請先註冊');
        return;
      }

      // Extract profile_id from UserCap
      const userCapContent = userCapObject.data.content as Record<string, unknown>;
      const userCapFields = userCapContent.fields as Record<string, unknown>;
      const profileId = userCapFields.profile_id as string;
      
      // Get UserProfile object
      const userProfileObject = await suiClient.getObject({
        id: profileId,
        options: {
          showContent: true,
          showType: true,
        }
      });

      if (!userProfileObject.data?.content) {
        setKioskInfo(null);
        setResult('無法獲取用戶資料');
        return;
      }

      // Extract kiosk_id from UserProfile
      const userProfileContent = userProfileObject.data.content as Record<string, unknown>;
      const userProfileFields = userProfileContent.fields as Record<string, unknown>;
      const kioskId = userProfileFields.kiosk_id as string;

      // Step 2: Find KioskOwnerCap object
      const kioskCapObjects = userObjects.data.filter(obj => 
        obj.data?.type?.includes('0x2::kiosk::KioskOwnerCap')
      );

      if (kioskCapObjects.length > 0) {
        const kioskCap = kioskCapObjects[0];
        
        setKioskInfo({
          id: kioskId,
          capId: kioskCap.data?.objectId || '',
          owner: address,
        });
        
        console.log('Found kiosk from user profile:', kioskId);
        console.log('Found kiosk cap:', kioskCap.data?.objectId);
      } else {
        setKioskInfo({
          id: kioskId,
          capId: '',
          owner: address,
        });
        console.log('Found kiosk from user profile:', kioskId);
        console.log('No kiosk cap found');
      }
    } catch (error) {
      console.error('Failed to load kiosk info:', error);
      setResult(`載入 Kiosk 資訊失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [address, suiClient, currentNetwork]);

  const loadListedTickets = useCallback(async (kioskId: string) => {
    if (!suiClient) return;
    
    try {
      console.log('Loading listed tickets from kiosk:', kioskId);
      setLoading(true);
      
      // Get kiosk object to find listed items
      const kioskObject = await suiClient.getObject({
        id: kioskId,
        options: {
          showContent: true,
          showType: true,
        }
      });

      if (!kioskObject.data?.objectId) {
        throw new Error('無法獲取 Kiosk 對象');
      }

      // Get dynamic fields with pagination
      let allDynamicFields: Array<{
        objectId: string;
        objectType: string;
        name: string;
      }> = [];
      let hasNextPage = true;
      let nextCursor: string | null = null;
      
      while (hasNextPage) {
        const dynamicFieldsResponse = await suiClient.getDynamicFields({
          parentId: kioskObject.data.objectId,
          cursor: nextCursor,
          limit: 50, // Fetch 50 items per page
        });
        
        // Convert DynamicFieldInfo to our expected format
        const convertedFields = dynamicFieldsResponse.data.map(field => ({
          objectId: field.objectId,
          objectType: field.objectType || '',
          name: String(field.name),
        }));
        
        allDynamicFields = allDynamicFields.concat(convertedFields);
        hasNextPage = dynamicFieldsResponse.hasNextPage;
        nextCursor = dynamicFieldsResponse.nextCursor;
        
        console.log(`Fetched ${dynamicFieldsResponse.data.length} dynamic fields, hasNextPage: ${hasNextPage}`);
      }
      
      console.log('Total dynamic fields:', allDynamicFields.length);
      console.log('All dynamic fields:', allDynamicFields);
      
      // Filter for ticket type objects
      const ticketType = getJastronPassStructType(JASTRON_PASS.MODULES.TICKET, JASTRON_PASS.STRUCTS.TICKET, currentNetwork, 'v1');
      const ticketDynamicFields = allDynamicFields.filter(field => 
        field.objectType && field.objectType.includes(ticketType)
      );
      
      console.log('Filtered ticket dynamic fields:', ticketDynamicFields);
      
      if (ticketDynamicFields.length === 0) {
        console.log('No ticket items found in kiosk');
        setListedTickets([]);
        setResult('Kiosk 中沒有列出的票券');
        return;
      }
      
      const itemIds = ticketDynamicFields.map(field => field.objectId);
      console.log('Found ticket item IDs:', itemIds, ticketDynamicFields);

      const listedTickets: ListedTicket[] = [];
      
      for (const itemId of itemIds) {
        try {
          // Get the item object
          const itemObject = await suiClient.getObject({
            id: itemId,
            options: {
              showContent: true,
              showType: true,
            }
          });

          if (itemObject.data?.content) {
            const itemContent = itemObject.data.content as Record<string, unknown>;
            const itemFields = itemContent.fields as Record<string, unknown>;
            
            // Check if this is a Ticket object
            if (itemContent.type && typeof itemContent.type === 'string' && 
                itemContent.type.includes(getJastronPassStructType(JASTRON_PASS.MODULES.TICKET, JASTRON_PASS.STRUCTS.TICKET, currentNetwork, 'v1'))) {
              
              const ticketId = ((itemFields.id as Record<string, unknown>).id as string);
              const activityId = itemFields.activity_id as string;
              
              // Get ticket price from kiosk using getTicketPrice
              const contract = createContract(currentNetwork);
              let ticketPrice = 0;
              let royaltyFee = 0;
              let platformFee = 0;
              let totalFees = 0;
              let totalCost = 0;
              
              try {
                // Use getTicketPrice directly and execute with suiClient
                const priceTx = await contract.getTicketPrice(kioskId, ticketId);
                const priceResult = await suiClient.devInspectTransactionBlock({
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  transactionBlock: priceTx as any,
                  sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
                });
                const priceData = priceResult?.results?.[0]?.returnValues?.[0];
                console.log('Price data:', priceData, priceResult);
                if (priceData && Array.isArray(priceData) && priceData.length > 0) {
                  ticketPrice = Number(bcs.u64().parse(new Uint8Array(priceData[0] as number[])));
                }
                console.log(`Ticket price for ${ticketId}:`, ticketPrice);
                
                // Calculate fees using transfer policy
                const transferPolicyId = getTicketTransferPolicyId(currentNetwork);
                
                try {
                  // Calculate royalty fee using transfer policy
                  const royaltyFeeResult = await contract.calculateRoyaltyFeeValue(transferPolicyId, ticketPrice);
                  const royaltyFeeData = royaltyFeeResult?.results?.[0]?.returnValues?.[0];
                  if (royaltyFeeData && Array.isArray(royaltyFeeData) && royaltyFeeData.length > 0) {
                    royaltyFee = Number(bcs.u64().parse(new Uint8Array(royaltyFeeData[0] as number[])));
                  }
                  
                  // Calculate platform fee using transfer policy
                  const platformFeeResult = await contract.calculatePlatformFeeValue(transferPolicyId, ticketPrice);
                  const platformFeeData = platformFeeResult?.results?.[0]?.returnValues?.[0];
                  if (platformFeeData && Array.isArray(platformFeeData) && platformFeeData.length > 0) {
                    platformFee = Number(bcs.u64().parse(new Uint8Array(platformFeeData[0] as number[])));
                  }
                  
                  // Calculate total fees and cost
                  totalFees = royaltyFee + platformFee;
                  totalCost = ticketPrice + totalFees;
                  
                  console.log(`Transfer policy fees for ticket ${ticketId}:`, {
                    ticketPrice,
                    royaltyFee,
                    platformFee,
                    totalFees,
                    totalCost
                  });
                } catch (error) {
                  console.warn(`Failed to calculate fees using transfer policy for ticket ${ticketId}:`, error);
                  // Fallback to hardcoded values if transfer policy calculation fails
                  royaltyFee = Math.floor(ticketPrice * 0.025);
                  platformFee = Math.floor(ticketPrice * 0.05);
                  totalFees = royaltyFee + platformFee;
                  totalCost = ticketPrice + totalFees;
                }
                
                console.log(`Fees for ticket ${ticketId}:`, {
                  ticketPrice,
                  royaltyFee,
                  platformFee,
                  totalFees,
                  totalCost
                });
              } catch (error) {
                console.warn(`Failed to get price for ticket ${ticketId}:`, error);
              }
              
              // Get activity details
              let activityName = '未知活動';
              let originalTicketPrice = 0;
              let organizerProfileId = '';
              let saleEndedAt = 0;
              let ticketsSold = 0;
              let totalSupply = 0;
              
              try {
                const activityObject = await suiClient.getObject({
                  id: activityId,
                  options: {
                    showContent: true,
                    showType: true,
                  }
                });
                
                if (activityObject.data?.content) {
                  const activityContent = activityObject.data.content as Record<string, unknown>;
                  const activityFields = activityContent.fields as Record<string, unknown>;
                  
                  activityName = activityFields.name as string || '未知活動';
                  originalTicketPrice = parseInt(String(activityFields.ticket_price)) || 0;
                  organizerProfileId = String(activityFields.organizer_profile_id || '');
                  saleEndedAt = parseInt(String(activityFields.sale_ended_at)) || 0;
                  ticketsSold = parseInt(String(activityFields.tickets_sold)) || 0;
                  totalSupply = parseInt(String(activityFields.total_supply)) || 0;
                }
              } catch (error) {
                console.warn(`Failed to load activity details for ${activityId}:`, error);
              }
              
              listedTickets.push({
                id: ticketId,
                objectId: itemId,
                price: ticketPrice,
                activityId,
                activityName,
                ticketPrice: originalTicketPrice,
                organizerProfileId,
                saleEndedAt,
                ticketsSold,
                totalSupply,
                royaltyFee,
                platformFee,
                totalFees,
                totalCost,
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to load item ${itemId}:`, error);
        }
      }
      
      setListedTickets(listedTickets);
      console.log('Loaded listed tickets:', listedTickets);
      setResult(`成功載入 ${listedTickets.length} 張列出的票券`);
    } catch (error) {
      console.error('Failed to load listed tickets:', error);
      setResult(`載入列出票券失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [suiClient, currentNetwork]);

  const handleSearchKiosk = async () => {
    if (!searchKioskId.trim()) {
      setResult('請輸入 Kiosk ID');
      return;
    }

    setLoading(true);
    setResult('正在搜尋 Kiosk...');
    
    try {
      const kioskObject = await suiClient.getObject({
        id: searchKioskId,
        options: {
          showContent: true,
          showType: true,
        }
      });

      if (kioskObject.data?.content) {
        const content = kioskObject.data.content as Record<string, unknown>;
        
        if (content.type && typeof content.type === 'string' && content.type.includes('0x2::kiosk::Kiosk')) {
          setKioskInfo({
            id: searchKioskId,
            capId: '', // We don't have the cap ID from search
            owner: address || '',
          });
          
          setResult(`✅ 找到 Kiosk: ${formatAddress(searchKioskId)}`);
          console.log('Found kiosk:', searchKioskId);
        } else {
          setResult('❌ 指定的對象不是有效的 Kiosk');
        }
      } else {
        setResult('❌ 未找到 Kiosk，請檢查 Kiosk ID 是否正確');
      }
    } catch (error) {
      console.error('Failed to search kiosk:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(`❌ 搜尋 Kiosk 失敗: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelistTicket = async (ticketId: string) => {
    if (!connected || !address || !executeTransaction) {
      setResult('請先連接錢包');
      return;
    }

    if (!kioskInfo) {
      setResult('請先選擇 Kiosk');
      return;
    }

    if (!kioskInfo.capId) {
      setResult('無法找到 KioskOwnerCap，請確保您擁有此 Kiosk 的權限');
      return;
    }

    setLoading(true);
    setResult('正在取消列出票券...');
    
    try {
      // Get user profile for receiver
      const userObjects = await suiClient.getOwnedObjects({
        owner: address,
        options: { showContent: true, showType: true }
      });
      
      const userCapObject = userObjects.data.find(obj => 
        obj.data?.type?.includes(getJastronPassStructType(JASTRON_PASS.MODULES.USER, JASTRON_PASS.STRUCTS.USER_CAP, currentNetwork, 'v1'))
      );
      
      if (!userCapObject?.data?.content) {
        throw new Error('請先註冊用戶資料');
      }
      
      const userCapContent = userCapObject.data.content as Record<string, unknown>;
      const userCapFields = userCapContent.fields as Record<string, unknown>;
      const userProfileId = userCapFields.profile_id as string;

      console.log('Delist ticket from kiosk:', kioskInfo.id, kioskInfo.capId, ticketId, userProfileId);

      // Use contract utility function
      const contract = createContract(currentNetwork);
      const tx = await contract.delistTicketFromKiosk(
        kioskInfo.id,
        kioskInfo.capId,
        ticketId,
        userProfileId
      );

      setResult('正在執行取消列出交易...');
      const result = await executeTransaction(tx);

      console.log('Delist ticket result:', result);
      setResult(`✅ 票券取消列出成功！交易: ${(result as { digest: string }).digest}`);
      
      // Refresh data
      setTimeout(() => {
        loadListedTickets(kioskInfo.id);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to delist ticket:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(`❌ 票券取消列出失敗: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseTicket = async (ticketId: string, price: number) => {
    if (!connected || !address || !executeTransaction) {
      setResult('請先連接錢包');
      return;
    }

    if (!kioskInfo) {
      setResult('請先選擇 Kiosk');
      return;
    }

    setLoading(true);
    setResult('正在購買票券...');
    
    try {
      const platformId = getPlatformId(currentNetwork);
      const transferPolicyId = getTicketTransferPolicyId(currentNetwork);
      
      // Get required objects
      const activityObject = await suiClient.getObject({
        id: listedTickets.find(t => t.id === ticketId)?.activityId || '',
        options: { showContent: true, showType: true }
      });
      
      if (!activityObject.data?.content) {
        throw new Error('無法獲取活動資訊');
      }
      
      const activityFields = (activityObject.data.content as Record<string, unknown>).fields as Record<string, unknown>;
      const organizerProfileId = activityFields.organizer_profile_id as string;
      
      // Get user profile
      const userObjects = await suiClient.getOwnedObjects({
        owner: address,
        options: { showContent: true, showType: true }
      });
      
      const userCapObject = userObjects.data.find(obj => 
        obj.data?.type?.includes(getJastronPassStructType(JASTRON_PASS.MODULES.USER, JASTRON_PASS.STRUCTS.USER_CAP, currentNetwork, 'v1'))
      );
      
      if (!userCapObject?.data?.content) {
        throw new Error('請先註冊用戶資料');
      }
      
      const userCapContent = userCapObject.data.content as Record<string, unknown>;
      const userCapFields = userCapContent.fields as Record<string, unknown>;
      const userProfileId = userCapFields.profile_id as string;
      
      // Get user profile object
      const userProfileObject = await suiClient.getObject({
        id: userProfileId,
        options: { showContent: true, showType: true }
      });
      
      if (!userProfileObject.data?.content) {
        throw new Error('無法獲取用戶資料');
      }

      // Get organizer profile
      const organizerProfileObject = await suiClient.getObject({
        id: organizerProfileId,
        options: { showContent: true, showType: true }
      });
      
      if (!organizerProfileObject.data?.content) {
        throw new Error('無法獲取主辦方資料');
      }

      // Get transfer policy
      const transferPolicyObject = await suiClient.getObject({
        id: transferPolicyId,
        options: { showContent: true, showType: true }
      });
      
      if (!transferPolicyObject.data?.content) {
        throw new Error('無法獲取轉移政策');
      }

      // Calculate total cost
      const royaltyFee = Math.floor(price * 0.025); // 2.5% royalty fee
      const platformFee = Math.floor(price * 0.05); // 5% platform fee
      const totalCost = price + royaltyFee + platformFee;

      // Verify Kiosk object exists and is accessible
      const kioskObject = await suiClient.getObject({
        id: kioskInfo.id,
        options: { showContent: true, showType: true }
      });
      
      if (!kioskObject.data?.content) {
        throw new Error('Kiosk 對象不存在或無法訪問');
      }
      
      const kioskType = kioskObject.data.type;
      if (!kioskType || !kioskType.includes('0x2::kiosk::Kiosk')) {
        throw new Error('指定的對象不是有效的 Kiosk');
      }

      // Check if the ticket is actually listed in the kiosk
      const contract = createContract(currentNetwork);
      try {
        const isListedResult = await contract.isTicketListedValue(kioskInfo.id, ticketId);
        const isListed = isListedResult?.results?.[0]?.returnValues?.[0];
        if (!isListed) {
          throw new Error('票券未在 Kiosk 中列出');
        }
        console.log('Ticket is listed in kiosk:', isListed);
      } catch (error) {
        console.warn('Failed to check if ticket is listed:', error);
        throw new Error('無法驗證票券是否在 Kiosk 中列出');
      }

      // Debug information
      console.log('Purchase ticket debug info:');
      console.log('kioskInfo.id:', kioskInfo.id);
      console.log('kioskType:', kioskType);
      console.log('ticketId:', ticketId);
      console.log('activityId:', listedTickets.find(t => t.id === ticketId)?.activityId);
      console.log('organizerProfileId:', organizerProfileId);
      console.log('platformId:', platformId);
      console.log('userProfileId:', userProfileId);
      console.log('transferPolicyId:', transferPolicyId);
      console.log('totalCost:', totalCost);
      
      // Additional validation
      console.log('Kiosk object details:', {
        objectId: kioskObject.data.objectId,
        version: kioskObject.data.version,
        digest: kioskObject.data.digest,
        owner: kioskObject.data.owner,
        previousTransaction: kioskObject.data.previousTransaction
      });
      
      // Check if we have the right to access this kiosk
      if (kioskObject.data.owner && kioskObject.data.owner !== address) {
        throw new Error('您沒有權限訪問此 Kiosk');
      }

      // Create transaction
      const { Transaction } = await import('@mysten/sui/transactions');
      const tx = new Transaction();
      tx.setGasBudget(500000000);
      
      // Split coins for payment
      const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(totalCost)]);
      
      // Call purchase_ticket function
      const [coin] = tx.moveCall({
        target: `${getLatestPackageId(currentNetwork)}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.PURCHASE_TICKET}`,
        arguments: [
          tx.object(kioskInfo.id),
          payment,
          tx.pure.id(ticketId),
          tx.object(listedTickets.find(t => t.id === ticketId)?.activityId || ''),
          tx.object(organizerProfileId),
          tx.object(platformId),
          tx.object(userProfileId),
          tx.object(transferPolicyId),
        ],
      });
      
      tx.transferObjects([coin], address);

      setResult('正在執行購買交易...');
      const result = await executeTransaction(tx);

      console.log('Purchase ticket result:', result);
      setResult(`✅ 票券購買成功！交易: ${(result as { digest: string }).digest}`);
      
      // Refresh data
      setTimeout(() => {
        loadListedTickets(kioskInfo.id);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to purchase ticket:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(`❌ 票券購買失敗: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Load kiosk info when connected
  useEffect(() => {
    if (connected && address) {
      loadKioskInfo();
    }
  }, [connected, address, loadKioskInfo]);

  // Load listed tickets when kiosk info is available
  useEffect(() => {
    if (kioskInfo?.id) {
      loadListedTickets(kioskInfo.id);
    }
  }, [kioskInfo?.id, loadListedTickets]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <WalletStatus />
      <WalletDebugStatus />
      <AccountSwitcher />
      <NetworkSwitcher />

      {result && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{result}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="kiosk" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kiosk">Kiosk 管理</TabsTrigger>
          <TabsTrigger value="tickets">列出的票券</TabsTrigger>
        </TabsList>

        <TabsContent value="kiosk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kiosk 資訊</CardTitle>
              <CardDescription>
                管理您的 Kiosk 和查看列出的票券
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="輸入 Kiosk ID 搜尋..."
                  value={searchKioskId}
                  onChange={(e) => setSearchKioskId(e.target.value)}
                />
                <Button 
                  onClick={handleSearchKiosk}
                  disabled={!searchKioskId.trim() || loading}
                >
                  {loading ? '搜尋中...' : '搜尋 Kiosk'}
                </Button>
              </div>
              
              <Button 
                onClick={loadKioskInfo} 
                disabled={loading}
                variant="outline"
              >
                {loading ? '載入中...' : '重新整理我的 Kiosk'}
              </Button>

              {kioskInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Kiosk ID</Label>
                      <Badge variant="outline" className="text-xs">
                        {formatAddress(kioskInfo.id)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">擁有者</Label>
                      <Badge variant="outline" className="text-xs">
                        {formatAddress(kioskInfo.owner)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>找到 Kiosk，共列出 {listedTickets.length} 張票券</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  未找到 Kiosk 或請先搜尋
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>列出的票券</CardTitle>
              <CardDescription>
                查看 Kiosk 中列出的所有票券
              </CardDescription>
            </CardHeader>
            <CardContent>
              {kioskInfo ? (
                <div className="space-y-4">
                  <Button 
                    onClick={() => loadListedTickets(kioskInfo.id)} 
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? '載入中...' : '重新整理票券列表'}
                  </Button>
                  
                  {listedTickets.length > 0 ? (
                    <div className="grid gap-4">
                      {listedTickets.map((ticket) => (
                        <Card key={ticket.id}>
                          <CardContent className="pt-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="font-medium">票券轉售</Label>
                                <Badge variant="default">
                                  轉售價格: {ticket.price.toLocaleString()} MIST
                                </Badge>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="font-medium">活動名稱</Label>
                                  <div className="text-lg font-semibold">{ticket.activityName}</div>
                                </div>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <Label className="text-muted-foreground">原價</Label>
                                      <p className="font-medium">{ticket.ticketPrice.toLocaleString()} MIST</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">轉售價</Label>
                                      <p className="font-medium text-green-600">{ticket.price.toLocaleString()} MIST</p>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <Label className="text-sm font-medium text-gray-700">費用明細 (Transfer Policy)</Label>
                                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Royalty Fee</span>
                                        <span className="font-medium">{ticket.royaltyFee.toLocaleString()} MIST</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Platform Fee</span>
                                        <span className="font-medium">{ticket.platformFee.toLocaleString()} MIST</span>
                                      </div>
                                      <div className="flex justify-between border-t pt-1 col-span-2">
                                        <span className="text-gray-600 font-medium">總費用</span>
                                        <span className="font-bold">{ticket.totalFees.toLocaleString()} MIST</span>
                                      </div>
                                      <div className="flex justify-between border-t pt-1 col-span-2">
                                        <span className="text-gray-800 font-semibold">總成本</span>
                                        <span className="font-bold text-red-600">{ticket.totalCost.toLocaleString()} MIST</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <Label className="text-muted-foreground">票券ID</Label>
                                      <p className="font-medium text-xs">{formatAddress(ticket.id)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">活動ID</Label>
                                      <p className="font-medium text-xs">{formatAddress(ticket.activityId)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    placeholder={`確認購買價格 (總成本: ${ticket.totalCost.toLocaleString()} MIST)`}
                                    value={selectedTicketForPurchase === ticket.id ? purchasePrice : ''}
                                    onChange={(e) => {
                                      setSelectedTicketForPurchase(ticket.id);
                                      setPurchasePrice(e.target.value);
                                    }}
                                    className="flex-1"
                                  />
                                  <Button
                                    onClick={() => handlePurchaseTicket(ticket.id, ticket.totalCost)}
                                    disabled={loading || selectedTicketForPurchase !== ticket.id || !purchasePrice}
                                    size="sm"
                                    variant="default"
                                  >
                                    {loading ? '購買中...' : `購買票券 (${ticket.totalCost.toLocaleString()} MIST)`}
                                  </Button>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleDelistTicket(ticket.id)}
                                    disabled={loading}
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1"
                                  >
                                    {loading ? '取消中...' : '取消列出'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      沒有列出的票券
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  請先選擇 Kiosk
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
