'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  useWalletAdapter, 
  SuiWalletButtonStable, 
  WalletStatus,
  getNetworkInfo,
  checkClientHealth,
  jastronPassContract,
  formatAddress,
  formatBalance,
  useSuiClient,
} from '@/lib/sui';

export function SuiDemo() {
  const { connected, address, signAndExecuteTransactionBlock } = useWalletAdapter();
  const suiClient = useSuiClient();
  const [networkInfo, setNetworkInfo] = useState<{ epoch: string; chainId?: string; totalStake: string; network: string } | null>(null);
  const [healthStatus, setHealthStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [suiBalance, setSuiBalance] = useState<string>('0');
  const [coins, setCoins] = useState<unknown[]>([]);
  const [objects, setObjects] = useState<unknown[]>([]);
  const [currentNetwork, setCurrentNetwork] = useState<string>('testnet');

  // Load network info and wallet assets
  useEffect(() => {
    const loadNetworkInfo = async () => {
      try {
        const info = await getNetworkInfo('testnet');
        setNetworkInfo(info);
      } catch (error) {
        console.error('Failed to load network info:', error);
      }
    };

    const checkHealth = async () => {
      const isHealthy = await checkClientHealth('testnet');
      setHealthStatus(isHealthy);
    };

    const loadWalletAssets = async () => {
      if (!address || !suiClient) return;
      
      try {
        console.log('Loading assets for address:', address);
        console.log('Using network:', currentNetwork);
        
        // Get SUI balance with retry
        let balance;
        try {
          balance = await suiClient.getBalance({
            owner: address,
            coinType: '0x2::sui::SUI'
          });
        } catch (balanceError) {
          console.error('Balance fetch failed:', balanceError);
          setResult(`Failed to fetch balance: ${balanceError}`);
          return;
        }
        
        console.log('SUI Balance response:', balance);
        setSuiBalance(balance.totalBalance);

        // Get all coins with retry
        let coinsData;
        try {
          coinsData = await suiClient.getCoins({
            owner: address,
            coinType: '0x2::sui::SUI'
          });
        } catch (coinsError) {
          console.error('Coins fetch failed:', coinsError);
          setResult(`Failed to fetch coins: ${coinsError}`);
          return;
        }
        
        console.log('Coins data:', coinsData);
        setCoins(coinsData.data);

        // Get all objects with retry
        let objectsData;
        try {
          objectsData = await suiClient.getOwnedObjects({
            owner: address,
            options: {
              showContent: true,
              showType: true,
              showOwner: true,
              showPreviousTransaction: true,
              showDisplay: true,
              showStorageRebate: true
            }
          });
        } catch (objectsError) {
          console.error('Objects fetch failed:', objectsError);
          setResult(`Failed to fetch objects: ${objectsError}`);
          return;
        }
        
        console.log('Objects data:', objectsData);
        setObjects(objectsData.data);
        
        setResult(`Successfully loaded assets on ${currentNetwork}! Found ${coinsData.data.length} SUI coins and ${objectsData.data.length} objects`);
      } catch (error) {
        console.error('Failed to load wallet assets:', error);
        setResult(`Failed to load assets: ${error}`);
      }
    };

    loadNetworkInfo();
    checkHealth();
    loadWalletAssets();
  }, [address, suiClient, currentNetwork]);

  const handleRegisterUser = async () => {
    if (!connected || !address) {
      setResult('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const txb = await jastronPassContract.registerUserProfile();

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: txb,
      });

      setResult(`User profile registered! Digest: ${(result as { digest: string }).digest}`);
    } catch (error) {
      setResult(`Transaction failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterOrganizer = async () => {
    if (!connected || !address) {
      setResult('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const txb = await jastronPassContract.registerOrganizerProfile();

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: txb,
      });

      setResult(`Organizer profile registered! Digest: ${(result as { digest: string }).digest}`);
    } catch (error) {
      setResult(`Transaction failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetUserObjects = async () => {
    if (!address) {
      setResult('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const objects = await jastronPassContract.getObjectsByOwner(address);
      setResult(`Found ${objects.data.length} objects for address ${formatAddress(address)}`);
    } catch (error) {
      setResult(`Failed to get objects: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAssets = async () => {
    if (!address) {
      setResult('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      console.log('Refreshing assets on network:', currentNetwork);
      
      // Get SUI balance
      const balance = await suiClient.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI'
      });
      setSuiBalance(balance.totalBalance);

      // Get all coins
      const coinsData = await suiClient.getCoins({
        owner: address,
        coinType: '0x2::sui::SUI'
      });
      setCoins(coinsData.data);

      // Get all objects
      const objectsData = await suiClient.getOwnedObjects({
        owner: address,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
          showPreviousTransaction: true,
          showDisplay: true,
          showStorageRebate: true
        }
      });
      setObjects(objectsData.data);

      setResult(`Assets refreshed on ${currentNetwork}! Found ${coinsData.data.length} SUI coins and ${objectsData.data.length} objects`);
    } catch (error) {
      console.error('Failed to refresh assets:', error);
      setResult(`Failed to refresh assets on ${currentNetwork}: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkChange = (newNetwork: string) => {
    setCurrentNetwork(newNetwork);
    setSuiBalance('0');
    setCoins([]);
    setObjects([]);
    setResult(`Switched to ${newNetwork} network`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sui Wallet Connection</CardTitle>
          <CardDescription>
            Connect your wallet to interact with the Jastron Pass contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <WalletStatus />
            <SuiWalletButtonStable />
          </div>
          
          {connected && address && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Connected Address</Label>
                <Input 
                  value={formatAddress(address)} 
                  readOnly 
                  className="font-mono"
                />
              </div>
              
              <div className="space-y-2">
                <Label>SUI Balance</Label>
                <div className="text-2xl font-bold text-green-600">
                  {formatBalance(suiBalance)} SUI
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Network</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={currentNetwork === 'testnet' ? 'default' : 'outline'}
                    onClick={() => handleNetworkChange('testnet')}
                  >
                    Testnet
                  </Button>
                  <Button
                    size="sm"
                    variant={currentNetwork === 'mainnet' ? 'default' : 'outline'}
                    onClick={() => handleNetworkChange('mainnet')}
                  >
                    Mainnet
                  </Button>
                  <Button
                    size="sm"
                    variant={currentNetwork === 'devnet' ? 'default' : 'outline'}
                    onClick={() => handleNetworkChange('devnet')}
                  >
                    Devnet
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network Information</CardTitle>
          <CardDescription>
            Current testnet status and information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Network Health</Label>
              <div className={`text-sm ${healthStatus ? 'text-green-600' : 'text-red-600'}`}>
                {healthStatus ? 'Healthy' : 'Unhealthy'}
              </div>
            </div>
            {networkInfo && (
              <>
                <div>
                  <Label>Epoch</Label>
                  <div className="text-sm">{networkInfo.epoch}</div>
                </div>
                <div>
                  <Label>Chain ID</Label>
                  <div className="text-sm font-mono">{networkInfo.chainId || 'N/A'}</div>
                </div>
                <div>
                  <Label>Total Stake</Label>
                  <div className="text-sm">{formatBalance(networkInfo.totalStake)}</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {connected && address && (
        <Card>
          <CardHeader>
            <CardTitle>Wallet Assets</CardTitle>
            <CardDescription>
              Your SUI tokens and objects in this wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SUI Coins</Label>
                <div className="text-lg font-semibold">
                  {coins.length} coins
                </div>
                <div className="text-sm text-gray-600">
                  Total: {formatBalance(suiBalance)} SUI
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Objects</Label>
                <div className="text-lg font-semibold">
                  {objects.length} objects
                </div>
                <div className="text-sm text-gray-600">
                  NFTs, tokens, and other assets
                </div>
              </div>
            </div>

            {coins.length > 0 && (
              <div className="space-y-2">
                <Label>SUI Coin Details</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {coins.slice(0, 5).map((coin, index) => (
                    <div key={(coin as { coinObjectId: string }).coinObjectId} className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      <div>Coin {index + 1}: {formatBalance((coin as { balance: string }).balance)} SUI</div>
                      <div className="text-gray-500">ID: {(coin as { coinObjectId: string }).coinObjectId.slice(0, 16)}...</div>
                    </div>
                  ))}
                  {coins.length > 5 && (
                    <div className="text-xs text-gray-500">
                      ... and {coins.length - 5} more coins
                    </div>
                  )}
                </div>
              </div>
            )}

            {objects.length > 0 && (
              <div className="space-y-2">
                <Label>Object Details</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {objects.slice(0, 3).map((obj, index) => (
                    <div key={(obj as { data?: { objectId?: string } }).data?.objectId} className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      <div>Object {index + 1}: {(obj as { data?: { type?: string } }).data?.type?.slice(0, 30)}...</div>
                      <div className="text-gray-500">ID: {(obj as { data?: { objectId?: string } }).data?.objectId?.slice(0, 16)}...</div>
                    </div>
                  ))}
                  {objects.length > 3 && (
                    <div className="text-xs text-gray-500">
                      ... and {objects.length - 3} more objects
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contract Interaction</CardTitle>
          <CardDescription>
            Test the Jastron Pass contract functions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleRegisterUser}
              disabled={!connected || loading}
            >
              {loading ? 'Processing...' : 'Register User'}
            </Button>
            <Button 
              onClick={handleRegisterOrganizer}
              disabled={!connected || loading}
              variant="outline"
            >
              {loading ? 'Processing...' : 'Register Organizer'}
            </Button>
            <Button 
              onClick={handleGetUserObjects}
              disabled={!connected || loading}
              variant="outline"
            >
              {loading ? 'Loading...' : 'Get My Objects'}
            </Button>
            <Button 
              onClick={handleRefreshAssets}
              disabled={!connected || loading}
              variant="secondary"
            >
              {loading ? 'Refreshing...' : 'Refresh Assets'}
            </Button>
          </div>
          
          {result && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
              <Label>Result</Label>
              <div className="text-sm font-mono break-all">{result}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
