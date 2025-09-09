'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  useWalletAdapter, 
  SuiWalletButton, 
  WalletStatus,
  getNetworkInfo,
  checkClientHealth,
  jastronPassContract,
  formatAddress,
  formatBalance,
} from '@/lib/sui';

export function SuiDemo() {
  const { connected, address, signAndExecuteTransactionBlock } = useWalletAdapter();
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // Load network info on mount
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

    loadNetworkInfo();
    checkHealth();
  }, []);

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

      setResult(`User profile registered! Digest: ${result.digest}`);
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

      setResult(`Organizer profile registered! Digest: ${result.digest}`);
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
            <SuiWalletButton />
          </div>
          
          {connected && address && (
            <div className="space-y-2">
              <Label>Connected Address</Label>
              <Input 
                value={formatAddress(address)} 
                readOnly 
                className="font-mono"
              />
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
                  <div className="text-sm font-mono">{networkInfo.chainId}</div>
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
