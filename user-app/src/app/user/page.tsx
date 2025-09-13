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
  WalletDebugStatus,
  formatAddress,
  formatBalance,
  createContract,
  JASTRON_PASS,
  getStructType,
  getEventType,
  getPlatformId
} from '@/lib/sui';
import { AccountSwitcher } from '@/components/account-switcher';
import { NetworkSwitcher } from '@/components/network-switcher';
import { useNetwork } from '@/context/network-context';
import { SuiClient } from '@mysten/sui.js/client';
import { SuiNetwork } from '@/lib/sui-config';
import { toHexString } from '@/lib/utils';

// Helper function to parse LinkedTable by fetching dynamic fields
async function parseLinkedTableActivities(parentNodeId: string, suiClient: SuiClient, currentNetwork: SuiNetwork): Promise<string[]> {
  try {
    console.log(`Fetching dynamic fields for parent node: ${parentNodeId}`);
    
    const allKeysAndNodeIds: Array<{ key: bigint; nodeId: string }> = [];
    let cursor: string | null = null;
    let hasNextPage = true;

    // 1. & 2. Fetch all dynamic fields (handling pagination)
    while (hasNextPage) {
      const dynamicFieldsPage = await suiClient.getDynamicFields({
        parentId: parentNodeId,
        cursor: cursor,
      });

      for (const fieldInfo of dynamicFieldsPage.data) {
        if (fieldInfo.name.type === 'u64') {
          allKeysAndNodeIds.push({
            key: BigInt(String(fieldInfo.name.value)), // The key is the u64
            nodeId: fieldInfo.objectId,      // The ID of the Node object
          });
        }
      }

      cursor = dynamicFieldsPage.nextCursor;
      hasNextPage = dynamicFieldsPage.hasNextPage;
    }

    console.log(`Found ${allKeysAndNodeIds.length} entries. Now fetching node objects...`);

    if (allKeysAndNodeIds.length === 0) {
      console.log('No dynamic fields found for platform object');
      return [];
    }

    // 3. Fetch the content of all Node objects in a single multi-get call for efficiency
    const nodeIds = allKeysAndNodeIds.map(item => item.nodeId);
    console.log('nodeIds:', nodeIds);
    const nodeObjects = await suiClient.multiGetObjects({
      ids: nodeIds,
      options: { showContent: true },
    });

    console.log('nodeObjects:', nodeObjects);

    // 4. Parse the Node objects to extract the final values
    const activityIds: string[] = [];

    for (const nodeObject of nodeObjects) {
      if (nodeObject.data?.content?.dataType === 'moveObject') {
        const fields = nodeObject.data.content.fields as Record<string, unknown>;
        // Note: The key isn't stored in the node, we have to map it back from our previous fetch
        const key = allKeysAndNodeIds.find(item => item.nodeId === nodeObject.data?.objectId)?.key;
        if (key !== undefined && fields.value) {
          // Navigate the nested structure: fields.value.fields.value
          const valueObj = fields.value as Record<string, unknown>;
          if (valueObj.fields && typeof valueObj.fields === 'object') {
            const innerFields = valueObj.fields as Record<string, unknown>;
            if (innerFields.value && typeof innerFields.value === 'string') {
              const activityId = innerFields.value; // This is the actual 0x2::object::ID
              console.log('activityId:', activityId);
              // Validate that this is actually an Activity object
              try {
                const activityObj = await suiClient.getObject({
                  id: activityId,
                  options: {
                    showContent: true,
                    showType: true,
                  }
                });
                
                if (activityObj.data?.type && activityObj.data.type.includes(getStructType(JASTRON_PASS.MODULES.ACTIVITY, JASTRON_PASS.STRUCTS.ACTIVITY, currentNetwork, 'v1'))) {
                  activityIds.push(activityId);
                  console.log(`Key: ${key.toString()}, Value (ActivityID): ${activityId}`);
                }
              } catch (error) {
                console.warn(`Failed to validate activity object ${activityId}:`, error);
              }
            }
          }
        }
      }
    }

    console.log('--- Parsed LinkedTable Content ---');
    console.log(`Found ${activityIds.length} valid activity IDs`);
    
    return activityIds;
  } catch (error) {
    console.error('Failed to parse LinkedTable:', error);
    return [];
  }
}

// Helper function to get activities from platform object as fallback
async function getActivitiesFromPlatform(platformId: string, suiClient: SuiClient): Promise<string[]> {
  try {
    console.log('Getting platform object directly as fallback:', platformId);
    
    // Get the platform object directly
    const platformObject = await suiClient.getObject({
      id: platformId,
      options: {
        showContent: true,
        showType: true,
      }
    });
    
    console.log('Platform object:', platformObject);
    
    if (platformObject.data?.content) {
      const content = platformObject.data.content as Record<string, unknown>;
      const fields = content.fields as Record<string, unknown>;
      
      // Look for activities field in the platform object
      const activitiesField = fields.activities;
      console.log('Activities field:', activitiesField);
      
      if (activitiesField) {
        // The activities field is a LinkedTable<u64, ID>
        // We need to extract the object IDs from the LinkedTable structure
        const activitiesObj = activitiesField as Record<string, unknown>;
        console.log('Activities object structure:', activitiesObj);
        
        // Try to find object IDs in the LinkedTable structure
        const objectIds: string[] = [];
        
        // Check if it has a fields property with object IDs
        if (activitiesObj.fields) {
          const activityFields = activitiesObj.fields as Record<string, unknown>;
          console.log('Activity fields:', activityFields);
          
          // Look for object IDs in the structure
          for (const [, value] of Object.entries(activityFields)) {
            if (typeof value === 'string' && value.startsWith('0x')) {
              objectIds.push(value);
            } else if (value && typeof value === 'object') {
              const obj = value as Record<string, unknown>;
              if (obj.id && typeof obj.id === 'string' && obj.id.startsWith('0x')) {
                objectIds.push(obj.id);
              }
            }
          }
        }
        
        // Also check if there are any direct object ID references
        if (activitiesObj.id && typeof activitiesObj.id === 'string' && activitiesObj.id.startsWith('0x')) {
          objectIds.push(activitiesObj.id);
        }
        
        console.log('Found activity object IDs from platform:', objectIds);
        return objectIds;
      }
      
      // If no activities field found, check if there are any other fields that might contain activity IDs
      console.log('All platform fields:', Object.keys(fields));
      
      // Look for any field that might contain activity IDs
      for (const [key, value] of Object.entries(fields)) {
        if (key.includes('activity') || key.includes('Activity')) {
          console.log(`Found potential activity field '${key}':`, value);
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error('Failed to get activities from platform:', error);
    return [];
  }
}

interface UserProfile {
  id: string;
  name: string;
  treasury: string;
  verified_at: number;
}

interface Activity {
  id: string;
  name: string;
  total_supply: number;
  tickets_sold: number;
  ticket_price: number;
  organizer_profile_id: string;
  sale_ended_at: number;
}

interface Ticket {
  id: string;
  activity_id: string;
  clipped_at: number;
  activity?: Activity;
}

export default function UserPage() {
  const { connected, address, executeTransaction, suiClient } = useWalletAdapter();
  
  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [searchActivityId, setSearchActivityId] = useState('');
  const [suiBalance, setSuiBalance] = useState<string>('0');
  const [userName, setUserName] = useState<string>('');
  const { currentNetwork } = useNetwork();
  const jastronPassContract = useMemo(() => createContract(currentNetwork), [currentNetwork]);

  const loadUserProfile = useCallback(async () => {
    if (!address || !suiClient) return;
    
    try {
      setLoading(true);
      console.log('Loading user profile for address:', address);
      
      // Step 1: Get user objects to find UserCap
      const objects = await suiClient.getOwnedObjects({
        owner: address,
        options: {
          showContent: true,
          showType: true,
        }
      });
      console.log('user owned objects:', objects);

      // Step 2: Find UserCap object
      const userCapObject = objects.data.find(obj => 
        obj.data?.type?.includes(getStructType(JASTRON_PASS.MODULES.USER, JASTRON_PASS.STRUCTS.USER_CAP, currentNetwork, 'v1'))
      );

      if (!userCapObject?.data?.content) {
        setResult('未找到 UserCap，請先註冊用戶資料');
        return;
      }

      // Step 3: Extract profile_id from UserCap
      const userCapContent = userCapObject.data.content as Record<string, unknown>;
      const userCapFields = userCapContent.fields as Record<string, unknown>;
      const profileId = userCapFields.profile_id as string;
      
      console.log('Found UserCap with profile_id:', profileId);

      // Step 4: Get UserProfile object using the profile_id
      const userProfileObject = await suiClient.getObject({
        id: profileId,
        options: {
          showContent: true,
          showType: true,
        }
      });

      if (userProfileObject.data?.content) {
        const content = userProfileObject.data.content as Record<string, unknown>;
        const fields = content.fields as Record<string, unknown>;
        const profile: UserProfile = {
          id: (fields.id as Record<string, unknown>).id as string,
          name: fields.name as string || 'Unknown User',
          treasury: fields.treasury as string,
          verified_at: parseInt(fields.verified_at as string),
        };
        setUserProfile(profile);
        setResult('用戶資料載入成功');
        console.log('Loaded user profile:', profile);
      } else {
        setResult('未找到 UserProfile 對象');
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setResult(`載入用戶資料失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [address, suiClient, currentNetwork]);

  const loadUserTickets = useCallback(async () => {
    if (!address || !suiClient) return;
    
    try {
      console.log('Loading user tickets for address:', address);
      
      // Get all objects
      const objects = await suiClient.getOwnedObjects({
        owner: address,
        options: {
          showContent: true,
          showType: true,
        }
      });

      // Find ProtectedTicket objects
      const ticketObjects = objects.data.filter(obj => 
        obj.data?.type?.includes(getStructType(JASTRON_PASS.MODULES.TICKET, JASTRON_PASS.STRUCTS.PROTECTED_TICKET, currentNetwork, 'v1'))
      );

      const tickets: Ticket[] = [];
      for (const obj of ticketObjects) {
        if (obj.data?.content) {
          const content = obj.data.content as Record<string, unknown>;
          const fields = content.fields as Record<string, unknown>;
          const ticketFields = fields.ticket as Record<string, unknown>;
          const ticket: Ticket = {
            id: ((ticketFields.id as Record<string, unknown>).id as string),
            activity_id: ticketFields.activity_id as string,
            clipped_at: parseInt(ticketFields.clipped_at as string),
          };
          tickets.push(ticket);
        }
      }

      setUserTickets(tickets);
      console.log('Found tickets:', tickets);
    } catch (error) {
      console.error('Failed to load user tickets:', error);
      setResult(`載入票券失敗: ${error}`);
    }
  }, [address, suiClient, currentNetwork]);

  const loadAvailableActivities = useCallback(async () => {
    if (!suiClient) return;
    
    try {
      console.log('Loading available activities from platform...');
      setLoading(true);
      
      const contract = jastronPassContract;
      const platformId = getPlatformId(currentNetwork);
      
      // Try to get activities from platform object directly
      let activities: string[] = [];
      
      try {
        // First try the contract function
        const activitiesResult = await contract.listActivitiesValue(platformId);
        console.log('Raw activities from platform:', activitiesResult);
        
        // Extract the LinkedTable data from DevInspectResults
        const linkedTableData = activitiesResult?.results?.[0]?.returnValues?.[0];
        console.log('LinkedTable data:', linkedTableData);
        
        if (linkedTableData && Array.isArray(linkedTableData) && linkedTableData.length >= 2) {
          // linkedTableData[0] contains the serialized LinkedTable data
          // linkedTableData[1] contains the type information
          const serializedData = linkedTableData[0] as number[];
          const typeInfo = linkedTableData[1] as string;
          
          console.log('Serialized LinkedTable data:', serializedData);
          console.log('Type info:', typeInfo);
          
          // Parse the LinkedTable to extract activity IDs
          const hexString = toHexString(serializedData);
          activities = await parseLinkedTableActivities(hexString, suiClient, currentNetwork);
          console.log('Parsed activity IDs from LinkedTable:', activities);
          
          // If no activities found from LinkedTable, try platform object as fallback
          if (activities.length === 0) {
            activities = await getActivitiesFromPlatform(platformId, suiClient);
            console.log('Fallback - got activities from platform object:', activities);
          }
        }
      } catch (error) {
        console.warn('Failed to get activities from contract function, trying direct platform object:', error);
        // Fallback to getting activities from platform object directly
        activities = await getActivitiesFromPlatform(platformId, suiClient);
        console.log('Fallback - got activities from platform object:', activities);
      }
      
      // If still no activities found, try to get activities from events
      if (activities.length === 0) {
        try {
          console.log('Trying to get activities from events...');
          const events = await suiClient.queryEvents({
            query: {
              MoveEventType: getEventType(JASTRON_PASS.MODULES.APP, JASTRON_PASS.EVENTS.ACTIVITY_CREATED, currentNetwork, 'v1')
            },
            limit: 50,
            order: 'descending'
          });
          
          console.log('Activity events:', events);
          
          const activityIds: string[] = [];
          for (const event of events.data) {
            if (event.parsedJson && typeof event.parsedJson === 'object') {
              const eventData = event.parsedJson as Record<string, unknown>;
              if (eventData.activity_id && typeof eventData.activity_id === 'string') {
                activityIds.push(eventData.activity_id);
              }
            }
          }
          
          if (activityIds.length > 0) {
            activities = activityIds;
            console.log('Found activities from events:', activities);
          }
        } catch (error) {
          console.warn('Failed to get activities from events:', error);
        }
      }
      
      if (activities && activities.length > 0) {
        // Convert the activities to our Activity interface
        const formattedActivities: Activity[] = activities.map((activityId: string) => ({
          id: activityId,
          name: '', // Will be filled by individual activity queries
          total_supply: 0, // Will be filled by individual activity queries
          tickets_sold: 0, // Will be filled by individual activity queries
          ticket_price: 0, // Will be filled by individual activity queries
          organizer_profile_id: '', // Will be filled by individual activity queries
          sale_ended_at: 0, // Will be filled by individual activity queries
        }));
        
        // For each activity, get detailed information
        const detailedActivities: Activity[] = [];
        for (const activity of formattedActivities) {
          try {
            const activityId = String(activity.id);
            const activityDetails = await suiClient.getObject({
              id: activityId,
              options: {
                showContent: true,
                showType: true,
              }
            });
            
            if (activityDetails && activityDetails.data?.content) {
              const content = activityDetails.data.content as Record<string, unknown>;
              const fields = content.fields as Record<string, unknown>;
              
              // Get activity name using the contract function
              const activityNameResult = await contract.getActivityNameValue(activityId);
              const activityNameRaw = activityNameResult?.results?.[0]?.returnValues?.[0];
              const activityName = typeof activityNameRaw === 'string' ? activityNameRaw : '';
              
              const detailedActivity: Activity = {
                id: activityId,
                name: activityName || '未命名活動',
                total_supply: parseInt(String(fields.total_supply)) || 0,
                tickets_sold: parseInt(String(fields.tickets_sold)) || 0,
                ticket_price: parseInt(String(fields.ticket_price)) || 0,
                organizer_profile_id: String(fields.organizer_profile_id || ''),
                sale_ended_at: parseInt(String(fields.sale_ended_at)) || 0,
              };
              
              detailedActivities.push(detailedActivity);
            }
          } catch (error) {
            console.warn(`Failed to load details for activity ${activity.id}:`, error);
            // Still add the basic activity info
            detailedActivities.push(activity);
          }
        }
        
        setAvailableActivities(detailedActivities);
        console.log('Loaded detailed activities:', detailedActivities);
        setResult(`成功載入 ${detailedActivities.length} 個活動`);
      } else {
        setAvailableActivities([]);
        setResult('目前沒有可用的活動');
        console.log('No activities found on platform');
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      setResult(`載入活動失敗: ${error}`);
      // Fallback to empty array
      setAvailableActivities([]);
    } finally {
      setLoading(false);
    }
  }, [suiClient, jastronPassContract, currentNetwork]);

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

  // Load user data
  useEffect(() => {
    if (connected && address) {
      loadUserProfile();
      loadUserTickets();
      loadAvailableActivities();
      loadSuiBalance();
    }
  }, [connected, address, loadUserProfile, loadUserTickets, loadAvailableActivities, loadSuiBalance]);

  const handleRegisterUser = async () => {
    console.log('Register user - Wallet state:', { 
      connected, 
      address, 
      hasExecuteFunction: !!executeTransaction,
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

    if (!userName.trim()) {
      setResult('請輸入用戶名稱');
      return;
    }

    setLoading(true);
    setResult('正在創建交易...');
    
    try {
      console.log('Creating user registration transaction...');
      const contract = jastronPassContract;
      const platformId = getPlatformId(currentNetwork); // Use platform ID from config
      
      setResult('正在構建交易...');
      const tx = await contract.registerUserProfile(platformId, userName.trim(), address);
      
      setResult('正在執行交易，請稍候...');
      console.log('Executing transaction...');
      const result = await executeTransaction(tx);

      console.log('User registration result:', result);
      setResult(`✅ 用戶註冊成功！交易: ${(result as { digest: string }).digest}`);
      
      // Clear the user name input
      setUserName('');
      
      // Reload user profile
      setTimeout(() => {
        loadUserProfile();
      }, 2000);
    } catch (error) {
      console.error('Failed to register user:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(`❌ 用戶註冊失敗: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTicket = async (activityId: string, ticketPrice: number) => {
    if (!connected || !address || !executeTransaction) {
      setResult('請先連接錢包');
      return;
    }

    setLoading(true);
    try {
      // For now, we'll show a message that this feature needs more implementation
      // In a real app, you'd need to get the required objects (platform, transferPolicy, etc.)
      setResult(`票券購買功能需要更多實作。活動ID: ${activityId}, 價格: ${formatBalance(ticketPrice.toString())} SUI`);
      
      // TODO: Implement actual ticket purchase with required objects
      // const contract = jastronPassContract;
      // const txb = await contract.buyTicketFromOrganizer(activityId, payment, platform, transferPolicy, organizerProfile, ticketReceiverProfile);
      
    } catch (error) {
      console.error('Failed to buy ticket:', error);
      setResult(`票券購買失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchActivity = async () => {
    if (!searchActivityId.trim()) {
      setResult('請輸入活動ID');
      return;
    }

    setLoading(true);
    setResult('正在搜尋活動...');
    
    try {
      const contract = jastronPassContract;
      
      // Try to get the activity object directly
      const activity = await contract.getObject(searchActivityId);
      console.log('Searched activity object:', activity);

      if (activity && activity.data?.content) {
        const content = activity.data.content as Record<string, unknown>;
        const fields = content.fields as Record<string, unknown>;
        
        // Check if this is an Activity object
        if (content.type && typeof content.type === 'string' && content.type.includes(getStructType(JASTRON_PASS.MODULES.ACTIVITY, JASTRON_PASS.STRUCTS.ACTIVITY, currentNetwork, 'v1'))) {
          // Get activity name using the contract function
          const activityNameResult = await contract.getActivityNameValue(searchActivityId);
          const activityNameRaw = activityNameResult?.results?.[0]?.returnValues?.[0];
          const activityName = typeof activityNameRaw === 'string' ? activityNameRaw : '';
          
          const activityData: Activity = {
            id: ((fields.id as Record<string, unknown>).id as string),
            name: activityName || '未命名活動',
            total_supply: parseInt(fields.total_supply as string),
            tickets_sold: parseInt(fields.tickets_sold as string),
            ticket_price: parseInt(fields.ticket_price as string),
            organizer_profile_id: fields.organizer_profile_id as string,
            sale_ended_at: parseInt(fields.sale_ended_at as string),
          };
          
          setAvailableActivities([activityData]);
          setResult(`✅ 找到活動: ${formatAddress(activityData.id)}`);
          console.log('Found activity:', activityData);
        } else {
          setResult('❌ 指定的對象不是有效的活動');
        }
      } else {
        setResult('❌ 未找到活動，請檢查活動ID是否正確');
      }
    } catch (error) {
      console.error('Failed to search activity:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(`❌ 搜尋活動失敗: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <WalletStatus />
      <WalletDebugStatus />
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

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">個人資料</TabsTrigger>
          {userProfile && <TabsTrigger value="tickets">我的票券</TabsTrigger>}
          <TabsTrigger value="activities">活動瀏覽</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>用戶資料</CardTitle>
              <CardDescription>
                管理您的用戶資料和註冊狀態
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medium">用戶名稱</Label>
                      <div className="text-lg font-semibold">
                        {userProfile.name}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">驗證狀態</Label>
                      <Badge variant={userProfile.verified_at > 0 ? "default" : "secondary"}>
                        {userProfile.verified_at > 0 ? "已驗證" : "未驗證"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">用戶ID</Label>
                      <Badge variant="outline" className="text-xs">
                        {formatAddress(userProfile.id)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">錢包地址</Label>
                      <Badge variant="outline" className="text-xs">
                        {formatAddress(userProfile.treasury)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    您還沒有註冊用戶資料。請填寫用戶名稱並點擊下方按鈕註冊。
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="user-name">用戶名稱 *</Label>
                    <Input
                      id="user-name"
                      type="text"
                      placeholder="輸入用戶名稱"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      請輸入一個有意義的用戶名稱，這將用於識別您的身份
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleRegisterUser} 
                    disabled={!connected || loading || !userName.trim()}
                    className="w-full"
                  >
                    {loading ? '註冊中...' : '註冊用戶資料'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>我的票券</CardTitle>
              <CardDescription>
                查看您擁有的所有票券
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userProfile ? (
                <div className="space-y-4">
                  <Button 
                    onClick={loadUserTickets} 
                    disabled={!connected || loading}
                    variant="outline"
                  >
                    {loading ? '載入中...' : '重新整理票券'}
                  </Button>
                  
                  {userTickets.length > 0 ? (
                    <div className="grid gap-4">
                      {userTickets.map((ticket, index) => (
                        <Card key={ticket.id}>
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="font-medium">票券 #{index + 1}</Label>
                                <Badge variant={ticket.clipped_at > 0 ? "destructive" : "default"}>
                                  {ticket.clipped_at > 0 ? "已使用" : "未使用"}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p>票券ID: {formatAddress(ticket.id)}</p>
                                <p>活動ID: {formatAddress(ticket.activity_id)}</p>
                                {ticket.clipped_at > 0 && (
                                  <p>使用時間: {new Date(ticket.clipped_at).toLocaleString()}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      您還沒有任何票券
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    請先註冊用戶資料才能查看票券
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="user-name-tickets">用戶名稱 *</Label>
                    <Input
                      id="user-name-tickets"
                      type="text"
                      placeholder="輸入用戶名稱"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      請輸入一個有意義的用戶名稱，這將用於識別您的身份
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleRegisterUser} 
                    disabled={!connected || loading || !userName.trim()}
                    className="w-full"
                  >
                    {loading ? '註冊中...' : '註冊用戶資料'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>活動瀏覽</CardTitle>
              <CardDescription>
                瀏覽可用的活動並購買票券
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="輸入活動ID搜尋..."
                  value={searchActivityId}
                  onChange={(e) => setSearchActivityId(e.target.value)}
                />
                <Button 
                  onClick={handleSearchActivity}
                  disabled={!searchActivityId.trim() || loading}
                >
                  {loading ? '搜尋中...' : '搜尋'}
                </Button>
              </div>
              
              <Button 
                onClick={loadAvailableActivities} 
                disabled={loading}
                variant="outline"
              >
                {loading ? '載入中...' : '重新整理活動列表'}
              </Button>

              {availableActivities.length > 0 ? (
                <div className="grid gap-4">
                  {availableActivities.map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">活動名稱</Label>
                              <div className="text-lg font-semibold">{activity.name || '未命名活動'}</div>
                            </div>
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">活動ID</Label>
                              <Badge variant="outline">{formatAddress(activity.id)}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-muted-foreground">票價</Label>
                                <p className="font-medium">{formatBalance(activity.ticket_price.toString())} SUI</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">剩餘票數</Label>
                                <p className="font-medium">{activity.total_supply - activity.tickets_sold} / {activity.total_supply}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">銷售結束時間</Label>
                                <p className="font-medium">
                                  {new Date(activity.sale_ended_at).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">狀態</Label>
                                <Badge variant={
                                  activity.tickets_sold < activity.total_supply && 
                                  activity.sale_ended_at > Date.now()
                                    ? "default" : "secondary"
                                }>
                                  {activity.tickets_sold < activity.total_supply && 
                                   activity.sale_ended_at > Date.now()
                                    ? "可購買" : "已售罄/已結束"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {activity.tickets_sold < activity.total_supply && 
                           activity.sale_ended_at > Date.now() && (
                            <Button 
                              onClick={() => handleBuyTicket(activity.id, activity.ticket_price)}
                              disabled={!connected || loading}
                              className="w-full"
                            >
                              {loading ? '購買中...' : `購買票券 (${formatBalance(activity.ticket_price.toString())} SUI)`}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  沒有找到可用活動
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
