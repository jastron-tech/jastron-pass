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
  JASTRON_PASS_PACKAGE,
  getPackageId
} from '@/lib/sui';
import { AccountSwitcher } from '@/components/account-switcher';
import { useNetwork } from '@/lib/network-context';

interface UserProfile {
  id: string;
  treasury: string;
  verified_at: number;
}

interface Activity {
  id: string;
  total_supply: number;
  tickets_sold: number;
  ticket_price: number;
  organizer_profile_id: string;
  sale_ended_at: number;
}

interface Ticket {
  id: string;
  activity_id: string;
  redeemed_at: number;
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
        obj.data?.type?.includes(`${getPackageId(currentNetwork)}::${JASTRON_PASS_PACKAGE.MODULES.USER}::${JASTRON_PASS_PACKAGE.STRUCTS.USER_CAP}`)
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
  }, [address, suiClient]);

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
        obj.data?.type?.includes('jastron_pass::ticket::ProtectedTicket')
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
            redeemed_at: parseInt(ticketFields.redeemed_at as string),
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
  }, [address, suiClient]);

  const loadAvailableActivities = useCallback(async () => {
    if (!suiClient) return;
    
    try {
      console.log('Loading available activities...');
      
      // For demo purposes, we'll create mock activities
      // In a real app, you'd query activities from a database or indexer

      // For demo purposes, create some mock activities
      const mockActivities: Activity[] = [
        {
          id: '0x1',
          total_supply: 100,
          tickets_sold: 25,
          ticket_price: 1000000000, // 1 SUI in MIST
          organizer_profile_id: '0x2',
          sale_ended_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        },
        {
          id: '0x3',
          total_supply: 50,
          tickets_sold: 10,
          ticket_price: 2000000000, // 2 SUI in MIST
          organizer_profile_id: '0x4',
          sale_ended_at: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days from now
        }
      ];

      setAvailableActivities(mockActivities);
      console.log('Loaded activities:', mockActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setResult(`載入活動失敗: ${error}`);
    }
  }, [suiClient]);

  // Load user data
  useEffect(() => {
    if (connected && address) {
      loadUserProfile();
      loadUserTickets();
      loadAvailableActivities();
    }
  }, [connected, address, loadUserProfile, loadUserTickets, loadAvailableActivities]);

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

    setLoading(true);
    try {
      console.log('Creating user registration transaction...');
      const contract = jastronPassContract;
      const tx = await contract.registerUserProfile(address);
      
      console.log('Executing transaction...');
      const result = await executeTransaction(tx);

      console.log('User registration result:', result);
      setResult(`用戶註冊成功！交易: ${(result as { digest: string }).digest}`);
      
      // Reload user profile
      setTimeout(() => {
        loadUserProfile();
      }, 2000);
    } catch (error) {
      console.error('Failed to register user:', error);
      setResult(`用戶註冊失敗: ${error}`);
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
    try {
      // Try to get the activity object
      const activity = await suiClient.getObject({
        id: searchActivityId,
        options: {
          showContent: true,
          showType: true,
        }
      });

      if (activity.data?.content) {
        const content = activity.data.content as Record<string, unknown>;
        const fields = content.fields as Record<string, unknown>;
        const activityData: Activity = {
          id: ((fields.id as Record<string, unknown>).id as string),
          total_supply: parseInt(fields.total_supply as string),
          tickets_sold: parseInt(fields.tickets_sold as string),
          ticket_price: parseInt(fields.ticket_price as string),
          organizer_profile_id: fields.organizer_profile_id as string,
          sale_ended_at: parseInt(fields.sale_ended_at as string),
        };
        
        setAvailableActivities([activityData]);
        setResult(`找到活動: ${activityData.id}`);
      } else {
        setResult('未找到活動');
      }
    } catch (error) {
      console.error('Failed to search activity:', error);
      setResult(`搜尋活動失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <WalletStatus />
      <WalletDebugStatus />
      <AccountSwitcher />

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
        </CardContent>
      </Card>

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
          <TabsTrigger value="tickets">我的票券</TabsTrigger>
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">用戶ID:</Label>
                    <Badge variant="outline">{formatAddress(userProfile.id)}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">錢包地址:</Label>
                    <Badge variant="outline">{formatAddress(userProfile.treasury)}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">驗證狀態:</Label>
                    <Badge variant={userProfile.verified_at > 0 ? "default" : "secondary"}>
                      {userProfile.verified_at > 0 ? "已驗證" : "未驗證"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    您還沒有註冊用戶資料。請先連接錢包，然後點擊下方按鈕註冊。
                  </p>
                  <Button 
                    onClick={handleRegisterUser} 
                    disabled={!connected || loading}
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
                              <Badge variant={ticket.redeemed_at > 0 ? "destructive" : "default"}>
                                {ticket.redeemed_at > 0 ? "已使用" : "未使用"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>票券ID: {formatAddress(ticket.id)}</p>
                              <p>活動ID: {formatAddress(ticket.activity_id)}</p>
                              {ticket.redeemed_at > 0 && (
                                <p>使用時間: {new Date(ticket.redeemed_at).toLocaleString()}</p>
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
