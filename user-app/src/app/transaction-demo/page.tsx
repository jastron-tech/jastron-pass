'use client';

import { useState } from 'react';
import { useWalletAdapter } from '@/lib/wallet-adapter';
import { jastronPassContract } from '@/lib/contract-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  executeWithRawSigner,
  executeWithSuiClient,
  executeStepByStep,
  executeWithWallet,
  createTestKeypair,
  createTestTransaction,
  executeTransactionExample,
  executeWithRetry,
  executeBatchTransactions
} from '@/lib/sui-transaction-examples';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

export default function TransactionDemoPage() {
  const { 
    connected, 
    address, 
    executeTransaction, 
    executeTransactionWithKeypair,
    executeTransactionStepByStep,
    suiClient 
  } = useWalletAdapter();
  
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [testKeypair, setTestKeypair] = useState<Ed25519Keypair | null>(null);

  // 生成测试 keypair
  const generateTestKeypair = () => {
    const keypair = createTestKeypair();
    setTestKeypair(keypair);
    setResult(`测试 keypair 已生成: ${keypair.getPublicKey().toSuiAddress()}`);
  };

  // 方法 1: 使用钱包签名 (推荐用于生产环境)
  const handleWalletTransaction = async () => {
    if (!connected) {
      setResult('請先連接錢包');
      return;
    }

    setLoading(true);
    try {
      const tx = await jastronPassContract.registerUserProfile();
      const result = await executeTransaction(tx);
      setResult(`錢包交易成功: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setResult(`錢包交易失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 方法 2: 使用 suiClient + keypair
  const handleSuiClientTransaction = async () => {
    if (!testKeypair) {
      setResult('請先生成測試 keypair');
      return;
    }

    setLoading(true);
    try {
      const tx = createTestTransaction();
      const result = await executeTransactionWithKeypair(tx, testKeypair);
      setResult(`SuiClient 交易成功: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setResult(`SuiClient 交易失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 方法 3: 分步执行
  const handleStepByStepTransaction = async () => {
    if (!testKeypair) {
      setResult('請先生成測試 keypair');
      return;
    }

    setLoading(true);
    try {
      const tx = createTestTransaction();
      const result = await executeTransactionStepByStep(tx, testKeypair);
      setResult(`分步執行交易成功: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setResult(`分步執行交易失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 方法 4: 使用示例函数
  const handleExampleTransaction = async () => {
    setLoading(true);
    try {
      const result = await executeTransactionExample(
        suiClient,
        connected, // 如果钱包连接，使用钱包签名
        connected ? executeTransaction : undefined
      );
      setResult(`示例交易成功: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setResult(`示例交易失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 方法 5: 带重试的交易
  const handleRetryTransaction = async () => {
    if (!testKeypair) {
      setResult('請先生成測試 keypair');
      return;
    }

    setLoading(true);
    try {
      const tx = createTestTransaction();
      const result = await executeWithRetry(suiClient, testKeypair, tx, 3);
      setResult(`重試交易成功: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setResult(`重試交易失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 方法 6: 批量交易
  const handleBatchTransaction = async () => {
    if (!testKeypair) {
      setResult('請先生成測試 keypair');
      return;
    }

    setLoading(true);
    try {
      const transactions = [
        createTestTransaction(),
        createTestTransaction(),
        createTestTransaction()
      ];
      
      const results = await executeBatchTransactions(suiClient, testKeypair, transactions);
      setResult(`批量交易結果: ${JSON.stringify(results, null, 2)}`);
    } catch (error) {
      setResult(`批量交易失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Sui PTB 交易執行演示</h1>
        <p className="text-muted-foreground">
          展示多種通過 suiClient 簽署並執行 PTB 的方法
        </p>
      </div>

      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wallet">錢包簽名</TabsTrigger>
          <TabsTrigger value="keypair">Keypair 簽名</TabsTrigger>
          <TabsTrigger value="advanced">進階方法</TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>方法 1: 使用錢包簽名 (生產環境推薦)</CardTitle>
              <CardDescription>
                使用連接的錢包來簽署並執行交易，這是最安全且用戶友好的方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant={connected ? "default" : "secondary"}>
                  {connected ? "已連接" : "未連接"}
                </Badge>
                {address && <span className="text-sm text-muted-foreground">{address}</span>}
              </div>
              
              <Button 
                onClick={handleWalletTransaction} 
                disabled={!connected || loading}
                className="w-full"
              >
                {loading ? "執行中..." : "執行錢包交易"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keypair" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>方法 2: 使用 Keypair 簽名 (開發環境)</CardTitle>
              <CardDescription>
                使用生成的 keypair 來簽署並執行交易，適用於開發和測試
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant={testKeypair ? "default" : "secondary"}>
                  {testKeypair ? "已生成" : "未生成"}
                </Badge>
                {testKeypair && (
                  <span className="text-sm text-muted-foreground">
                    {testKeypair.getPublicKey().toSuiAddress()}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={generateTestKeypair} variant="outline">
                  生成測試 Keypair
                </Button>
                <Button 
                  onClick={handleSuiClientTransaction} 
                  disabled={!testKeypair || loading}
                >
                  {loading ? "執行中..." : "執行 SuiClient 交易"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>方法 3: 分步執行交易</CardTitle>
              <CardDescription>
                先簽名交易，然後再執行，可以更好地控制交易流程
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleStepByStepTransaction} 
                disabled={!testKeypair || loading}
                className="w-full"
              >
                {loading ? "執行中..." : "分步執行交易"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>方法 4: 智能交易執行</CardTitle>
              <CardDescription>
                自動選擇最佳的交易執行方式（錢包或 keypair）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleExampleTransaction} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "執行中..." : "智能執行交易"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>方法 5: 帶重試的交易執行</CardTitle>
              <CardDescription>
                如果交易失敗，會自動重試最多 3 次
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleRetryTransaction} 
                disabled={!testKeypair || loading}
                className="w-full"
              >
                {loading ? "執行中..." : "重試交易執行"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>方法 6: 批量交易執行</CardTitle>
              <CardDescription>
                同時執行多個交易，並顯示每個交易的結果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleBatchTransaction} 
                disabled={!testKeypair || loading}
                className="w-full"
              >
                {loading ? "執行中..." : "批量交易執行"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>執行結果</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
