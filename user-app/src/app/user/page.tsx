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
  getJastronPassStructType,
  getPlatformId,
  getLatestPackageId,
  getTicketTransferPolicyId
} from '@/lib/sui';
import { AccountSwitcher } from '@/components/account-switcher';
import { NetworkSwitcher } from '@/components/network-switcher';
import { useNetwork } from '@/context/network-context';
import { toHexString, parseLinkedTableValues } from '@/lib/utils';
import { bcs } from '@mysten/bcs';
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
  objectId: string;
  type: string;
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
  const [kioskId, setKioskId] = useState<string>('');
  const [kioskCapId, setKioskCapId] = useState<string>('');
  const [resellPrice, setResellPrice] = useState<string>('');
  const [selectedTicketForResell, setSelectedTicketForResell] = useState<string>('');
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
        obj.data?.type?.includes(getJastronPassStructType(JASTRON_PASS.MODULES.USER, JASTRON_PASS.STRUCTS.USER_CAP, currentNetwork, 'v1'))
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
      setLoading(true);
      
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
        obj.data?.type?.includes(getJastronPassStructType(JASTRON_PASS.MODULES.TICKET, JASTRON_PASS.STRUCTS.PROTECTED_TICKET, currentNetwork, 'v1'))
      );

      console.log(`Found ${ticketObjects.length} ProtectedTicket objects`);

      const tickets: Ticket[] = [];
      for (const obj of ticketObjects) {
        if (obj.data?.content) {
          const content = obj.data.content as Record<string, unknown>;
          console.log('Ticket object content:', content);
          
          const fields = content.fields as Record<string, unknown>;
          console.log('Ticket object fields:', fields);
          
          const _ticket = fields.ticket as Record<string, unknown>;
          const ticketFields = _ticket.fields as Record<string, unknown>;
          console.log('Ticket fields:', ticketFields);
          
          // Check if ticketFields exists and has required properties
          if (!ticketFields) {
            console.warn('ticketFields is undefined for object:', obj.data);
            continue;
          }
          
          if (!ticketFields.id) {
            console.warn('ticketFields.id is undefined:', ticketFields);
            continue;
          }
          
          if (!ticketFields.activity_id) {
            console.warn('ticketFields.activity_id is undefined:', ticketFields);
            continue;
          }
          
          // Safely extract ticket properties
          const ticketId = ticketFields.id && typeof ticketFields.id === 'object' && 'id' in ticketFields.id 
            ? (ticketFields.id as Record<string, unknown>).id as string
            : ticketFields.id as string;
            
          const activityId = ticketFields.activity_id as string;
          const clippedAt = ticketFields.clipped_at ? parseInt(String(ticketFields.clipped_at)) : 0;
          
          const ticket: Ticket = {
            id: ticketId,
            activity_id: activityId,
            clipped_at: clippedAt,
            objectId: obj.data.objectId,
            type: obj.data.type || '',
          };

          // Try to get activity details for this ticket
          try {
            const activityObject = await suiClient.getObject({
              id: ticket.activity_id,
              options: {
                showContent: true,
                showType: true,
              }
            });
            
            if (activityObject.data?.content) {
              const activityContent = activityObject.data.content as Record<string, unknown>;
              const activityFields = activityContent.fields as Record<string, unknown>;
              
              ticket.activity = {
                id: ticket.activity_id,
                name: activityFields.name as string || '未命名活動',
                total_supply: parseInt(String(activityFields.total_supply)) || 0,
                tickets_sold: parseInt(String(activityFields.tickets_sold)) || 0,
                ticket_price: parseInt(String(activityFields.ticket_price)) || 0,
                organizer_profile_id: String(activityFields.organizer_profile_id || ''),
                sale_ended_at: parseInt(String(activityFields.sale_ended_at)) || 0,
              };
            }
          } catch (error) {
            console.warn(`Failed to load activity details for ticket ${ticket.id}:`, error);
          }
          
          tickets.push(ticket);
        }
      }

      setUserTickets(tickets);
      console.log('Found tickets with details:', tickets);
      setResult(`成功載入 ${tickets.length} 張票券`);
    } catch (error) {
      console.error('Failed to load user tickets:', error);
      setResult(`載入票券失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [address, suiClient, currentNetwork]);

  const loadKioskInfo = useCallback(async () => {
    if (!address || !suiClient) return;
    
    try {
      console.log('Loading kiosk info for address:', address);
      
      // First, get user profile to find kiosk_id
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
        console.log('Cannot find user cap for kiosk info');
        return;
      }

      // Extract profile_id from UserCap
      const userCapContent = userCapObject.data.content as Record<string, unknown>;
      const userCapFields = userCapContent.fields as Record<string, unknown>;
      const profileId = userCapFields.profile_id as string;
      
      // Get UserProfile object to find kiosk_id
      const userProfileObject = await suiClient.getObject({
        id: profileId,
        options: {
          showContent: true,
          showType: true,
        }
      });

      if (!userProfileObject.data?.content) {
        console.log('Cannot load user profile for kiosk info');
        return;
      }

      // Extract kiosk_id from UserProfile
      const userProfileContent = userProfileObject.data.content as Record<string, unknown>;
      const userProfileFields = userProfileContent.fields as Record<string, unknown>;
      const kioskId = userProfileFields.kiosk_id as string;

      setKioskId(kioskId);
      console.log('Found kiosk from user profile:', kioskId);

      // Find KioskOwnerCap objects
      const kioskCapObjects = userObjects.data.filter(obj => 
        obj.data?.type?.includes('0x2::kiosk::KioskOwnerCap')
      );

      if (kioskCapObjects.length > 0) {
        setKioskCapId(kioskCapObjects[0].data?.objectId || '');
        console.log('Found kiosk cap:', kioskCapObjects[0].data?.objectId);
      }

      console.log(`Found kiosk from profile and ${kioskCapObjects.length} kiosk caps`);
    } catch (error) {
      console.error('Failed to load kiosk info:', error);
      setResult(`載入 Kiosk 資訊失敗: ${error}`);
    }
  }, [address, suiClient, currentNetwork]);

  const loadAvailableActivities = useCallback(async () => {
    if (!suiClient) return;
    
    try {
      console.log('Loading available activities from platform...');
      setLoading(true);
      
      const contract = createContract(currentNetwork);
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
          const parsedValues = await parseLinkedTableValues(hexString, suiClient);
          console.log('Parsed activity IDs from LinkedTable:', parsedValues);
          
          activities = parsedValues.map(value => value.value);
        }
      } catch (error) {
        console.warn('Failed to get activities from contract function', error);
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
              const activityName = fields.name as string;
              
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
  }, [suiClient, currentNetwork]);

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
      loadKioskInfo();
    }
  }, [connected, address, loadUserProfile, loadUserTickets, loadAvailableActivities, loadSuiBalance, loadKioskInfo]);

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

    if (!userProfile) {
      setResult('請先註冊用戶資料');
      return;
    }

    setLoading(true);
    setResult('正在準備購買票券...');
    
    try {
      console.log('Starting ticket purchase process...');
      const platformId = getPlatformId(currentNetwork);
      
      // Step 1: Get required objects
      setResult('正在獲取所需對象...');
      
      // Get platform object
      const platformObject = await suiClient.getObject({
        id: platformId,
        options: { showContent: true, showType: true }
      });
      
      if (!platformObject.data?.content) {
        throw new Error('無法獲取平台對象');
      }

      // Get activity object to find organizer profile
      const activityObject = await suiClient.getObject({
        id: activityId,
        options: { showContent: true, showType: true }
      });
      
      if (!activityObject.data?.content) {
        throw new Error('無法獲取活動對象');
      }
      
      const activityFields = (activityObject.data.content as Record<string, unknown>).fields as Record<string, unknown>;
      const organizerProfileId = activityFields.organizer_profile_id as string;
      
      // Get organizer profile object
      const organizerProfileObject = await suiClient.getObject({
        id: organizerProfileId,
        options: { showContent: true, showType: true }
      });
      
      if (!organizerProfileObject.data?.content) {
        throw new Error('無法獲取主辦方資料');
      }

      // Get user profile object
      const userProfileObject = await suiClient.getObject({
        id: userProfile.id,
        options: { showContent: true, showType: true }
      });
      
      if (!userProfileObject.data?.content) {
        throw new Error('無法獲取用戶資料');
      }

      // Step 2: Get transfer policy ID from config
      setResult('正在獲取轉移政策...');
      
      const transferPolicyId = getTicketTransferPolicyId(currentNetwork);
      
      if (!transferPolicyId) {
        throw new Error('未配置轉移政策ID，請檢查網路設定');
      }

      // Step 3: Calculate platform fee based on transfer policy
      setResult('正在計算平台費用...');
      
      let platformFee = 0;
      try {
        // Use contract to calculate platform fee
        const contract = jastronPassContract;
        const platformFeeResult = await contract.calculatePlatformFeeValue(
          transferPolicyId,
          ticketPrice
        );
        
        // Extract platform fee from result
        const platformFeeData = platformFeeResult?.results?.[0]?.returnValues?.[0];
        if (platformFeeData && Array.isArray(platformFeeData) && platformFeeData.length > 0) {
          platformFee = Number(bcs.u64().parse(new Uint8Array(platformFeeData[0] as number[])));
        }
      } catch (error) {
        console.warn('Failed to calculate platform fee from policy, using fallback:', error);
        // Fallback to 5% if calculation fails
        platformFee = Math.floor(ticketPrice * 0.05);
      }
      
      const totalCost = ticketPrice + platformFee;
      
      console.log(`Ticket price: ${ticketPrice}, Platform fee: ${platformFee}, Total: ${totalCost}`);
      
      // Show fee breakdown to user
      setResult(`票券價格: ${ticketPrice.toLocaleString()} MIST, 平台費用: ${platformFee.toLocaleString()} MIST, 總計: ${totalCost.toLocaleString()} MIST`);
      
      // Step 4: Create transaction
      setResult('正在創建交易...');
      
      // Import Transaction from @mysten/sui/transactions
      const { Transaction } = await import('@mysten/sui/transactions');
      
      // Create a new transaction block
      const tx = new Transaction();
      tx.setGasBudget(500000000); // Set gas budget
      
      // Split coins to create payment
      const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(totalCost)]);
      
      // Call buy_ticket_from_organizer function
      const [coin] = tx.moveCall({
        target: `${getLatestPackageId(currentNetwork)}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.BUY_TICKET_FROM_ORGANIZER}`,
        arguments: [
          tx.object(activityId),
          payment, // Use the split coin as payment
          tx.object(platformId),
          tx.object(transferPolicyId),
          tx.object(organizerProfileId),
          tx.object(userProfile.id),
        ],
      });
      tx.transferObjects([coin], address);

      setResult('正在執行交易，請稍候...');
      
      console.log('Executing ticket purchase transaction...');
      const result = await executeTransaction(tx);

      console.log('Ticket purchase result:', result);
      setResult(`✅ 票券購買成功！交易: ${(result as { digest: string }).digest}`);
      
      // Refresh user data
      setTimeout(() => {
        loadUserProfile();
        loadUserTickets();
        loadAvailableActivities();
        loadSuiBalance();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to buy ticket:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(`❌ 票券購買失敗: ${errorMessage}`);
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
        if (content.type && typeof content.type === 'string' && content.type.includes(getJastronPassStructType(JASTRON_PASS.MODULES.ACTIVITY, JASTRON_PASS.STRUCTS.ACTIVITY, currentNetwork, 'v1'))) {
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

  const handleListTicketForResell = async () => {
    if (!connected || !address || !executeTransaction) {
      setResult('請先連接錢包');
      return;
    }

    if (!selectedTicketForResell || !resellPrice || !kioskId || !kioskCapId) {
      setResult('請選擇票券、填寫價格並確保有 Kiosk');
      return;
    }

    setLoading(true);
    setResult('正在列出票券轉售...');
    
    try {
      const contract = jastronPassContract;
      const transferPolicyId = getTicketTransferPolicyId(currentNetwork);
      
      // Get the selected ticket
      const selectedTicket = userTickets.find(ticket => ticket.objectId === selectedTicketForResell);
      if (!selectedTicket) {
        throw new Error('找不到選中的票券');
      }

      // Get activity object for the ticket
      const activityObject = await suiClient.getObject({
        id: selectedTicket.activity_id,
        options: { showContent: true, showType: true }
      });
      
      if (!activityObject.data?.content) {
        throw new Error('無法獲取活動資訊');
      }

      const tx = await contract.listTicketForResell(
        kioskId,
        kioskCapId,
        transferPolicyId,
        selectedTicket.activity_id,
        selectedTicketForResell,
        parseInt(resellPrice)
      );
      
      setResult('正在執行列出票券交易...');
      const result = await executeTransaction(tx);

      console.log('List ticket result:', result);
      setResult(`✅ 票券列出成功！交易: ${(result as { digest: string }).digest}`);
      
      // Clear form
      setSelectedTicketForResell('');
      setResellPrice('');
      
      // Refresh data
      setTimeout(() => {
        loadUserTickets();
        loadKioskInfo();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to list ticket for resell:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(`❌ 列出票券失敗: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelistTicket = async (ticketId: string) => {
    if (!connected || !address || !executeTransaction) {
      setResult('請先連接錢包');
      return;
    }

    if (!kioskId || !kioskCapId) {
      setResult('請確保有 Kiosk 和 KioskCap');
      return;
    }

    setLoading(true);
    setResult('正在取消列出票券...');
    
    try {
      const contract = jastronPassContract;
      
      const tx = await contract.delistTicket(
        kioskId,
        kioskCapId,
        ticketId
      );
      
      setResult('正在執行取消列出交易...');
      const result = await executeTransaction(tx);

      console.log('Delist ticket result:', result);
      setResult(`✅ 票券取消列出成功！交易: ${(result as { digest: string }).digest}`);
      
      // Refresh data
      setTimeout(() => {
        loadUserTickets();
        loadKioskInfo();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to delist ticket:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(`❌ 取消列出票券失敗: ${errorMessage}`);
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
          {/* Kiosk Status */}
          <Card>
            <CardHeader>
              <CardTitle>Kiosk 狀態</CardTitle>
              <CardDescription>
                管理您的 Kiosk 和轉售功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium">Kiosk ID</Label>
                    <div className="text-sm">
                      {kioskId ? (
                        <Badge variant="outline" className="text-xs">
                          {formatAddress(kioskId)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">未找到 Kiosk</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">KioskCap ID</Label>
                    <div className="text-sm">
                      {kioskCapId ? (
                        <Badge variant="outline" className="text-xs">
                          {formatAddress(kioskCapId)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">未找到 KioskCap</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={loadKioskInfo} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? '載入中...' : '重新整理 Kiosk 資訊'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Statistics */}
          {userTickets.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">總票券數</CardTitle>
                  <Badge variant="outline">票券</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userTickets.length}</div>
                  <p className="text-xs text-muted-foreground">
                    您擁有的票券總數
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">未使用</CardTitle>
                  <Badge variant="default">可用</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userTickets.filter(ticket => ticket.clipped_at === 0).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    尚未使用的票券
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">已使用</CardTitle>
                  <Badge variant="destructive">已用</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userTickets.filter(ticket => ticket.clipped_at > 0).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    已經使用的票券
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>我的票券</CardTitle>
              <CardDescription>
                查看您擁有的所有票券詳細資訊
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
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="font-medium">票券 #{index + 1}</Label>
                                <Badge variant={ticket.clipped_at > 0 ? "destructive" : "default"}>
                                  {ticket.clipped_at > 0 ? "已使用" : "未使用"}
                                </Badge>
                              </div>
                              
                              {/* Activity Information */}
                              {ticket.activity ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="font-medium">活動名稱</Label>
                                    <div className="text-lg font-semibold">{ticket.activity.name}</div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <Label className="text-muted-foreground">票價</Label>
                                      <p className="font-medium">{ticket.activity.ticket_price.toLocaleString()} MIST</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">銷售狀態</Label>
                                      <p className="font-medium">
                                        {ticket.activity.tickets_sold} / {ticket.activity.total_supply}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">活動結束時間</Label>
                                      <p className="font-medium">
                                        {new Date(ticket.activity.sale_ended_at).toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">活動狀態</Label>
                                      <Badge variant={
                                        ticket.activity.tickets_sold < ticket.activity.total_supply && 
                                        ticket.activity.sale_ended_at > Date.now()
                                          ? "default" : "secondary"
                                      }>
                                        {ticket.activity.tickets_sold < ticket.activity.total_supply && 
                                         ticket.activity.sale_ended_at > Date.now()
                                          ? "進行中" : "已結束"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  <p>無法載入活動詳細資訊</p>
                                </div>
                              )}
                              
                              {/* Ticket Information */}
                              <div className="space-y-2">
                                <Label className="font-medium">票券詳細資訊</Label>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>票券ID: {formatAddress(ticket.id)}</p>
                                  <p>活動ID: {formatAddress(ticket.activity_id)}</p>
                                  <p>對象ID: {formatAddress(ticket.objectId)}</p>
                                  <p>類型: {ticket.type}</p>
                                  {ticket.clipped_at > 0 && (
                                    <p>使用時間: {new Date(ticket.clipped_at).toLocaleString()}</p>
                                  )}
                                </div>
                              </div>

                              {/* Kiosk Actions */}
                              {ticket.clipped_at === 0 && kioskId && kioskCapId && (
                                <div className="space-y-2">
                                  <Label className="font-medium">轉售操作</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      placeholder="轉售價格 (MIST)"
                                      value={selectedTicketForResell === ticket.objectId ? resellPrice : ''}
                                      onChange={(e) => {
                                        setSelectedTicketForResell(ticket.objectId);
                                        setResellPrice(e.target.value);
                                      }}
                                      className="flex-1"
                                    />
                                    <Button
                                      onClick={() => handleListTicketForResell()}
                                      disabled={loading || !resellPrice || selectedTicketForResell !== ticket.objectId}
                                      size="sm"
                                    >
                                      {loading ? '列出中...' : '列出轉售'}
                                    </Button>
                                    <Button
                                      onClick={() => handleDelistTicket(ticket.id)}
                                      disabled={loading}
                                      variant="outline"
                                      size="sm"
                                    >
                                      {loading ? '取消中...' : '取消列出'}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {ticket.clipped_at === 0 && (!kioskId || !kioskCapId) && (
                                <div className="text-sm text-muted-foreground">
                                  <p>需要 Kiosk 才能進行轉售操作</p>
                                </div>
                              )}
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
                                <p className="font-medium">{activity.ticket_price.toLocaleString()} MIST</p>
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
                              {loading ? '購買中...' : `購買票券 (${activity.ticket_price.toLocaleString()} MIST + 平台費用)`}
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
