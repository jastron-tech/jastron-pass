/**
 * Sui Client PTB (Programmable Transaction Block) 签署和执行示例
 * 
 * 这个文件展示了多种通过 suiClient 签署并执行 PTB 的方法
 */

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { RawSigner } from '@mysten/sui/transactions';

// 方法 1: 使用 RawSigner (推荐用于开发环境)
export async function executeWithRawSigner(
  suiClient: SuiClient,
  keypair: Ed25519Keypair,
  transaction: Transaction
) {
  try {
    // 创建 RawSigner
    const signer = new RawSigner(keypair, suiClient);
    
    // 签署并执行交易
    const result = await signer.signAndExecuteTransactionBlock({
      transactionBlock: transaction,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      }
    });
    
    console.log('RawSigner 交易结果:', result);
    return result;
  } catch (error) {
    console.error('RawSigner 交易失败:', error);
    throw error;
  }
}

// 方法 2: 使用 suiClient.signAndExecuteTransactionBlock (需要 keypair)
export async function executeWithSuiClient(
  suiClient: SuiClient,
  keypair: Ed25519Keypair,
  transaction: Transaction
) {
  try {
    // 直接使用 suiClient 的 signAndExecuteTransactionBlock 方法
    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: transaction,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      }
    });
    
    console.log('SuiClient 交易结果:', result);
    return result;
  } catch (error) {
    console.error('SuiClient 交易失败:', error);
    throw error;
  }
}

// 方法 3: 分步执行 (先签名，再执行)
export async function executeStepByStep(
  suiClient: SuiClient,
  keypair: Ed25519Keypair,
  transaction: Transaction
) {
  try {
    // 步骤 1: 签名交易
    const { bytes, signature } = await transaction.sign({
      client: suiClient,
      signer: keypair,
    });
    
    console.log('交易已签名:', { bytes, signature });
    
    // 步骤 2: 执行已签名的交易
    const result = await suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      }
    });
    
    console.log('分步执行交易结果:', result);
    return result;
  } catch (error) {
    console.error('分步执行交易失败:', error);
    throw error;
  }
}

// 方法 4: 使用钱包的 signAndExecuteTransactionBlock (生产环境推荐)
export async function executeWithWallet(
  walletSignAndExecuteTransactionBlock: (tx: unknown) => Promise<unknown>,
  transaction: Transaction
) {
  try {
    // 使用钱包提供的签名方法
    const result = await walletSignAndExecuteTransactionBlock(transaction);
    
    console.log('钱包交易结果:', result);
    return result;
  } catch (error) {
    console.error('钱包交易失败:', error);
    throw error;
  }
}

// 方法 5: 创建测试用的 keypair 和交易
export function createTestKeypair(): Ed25519Keypair {
  return new Ed25519Keypair();
}

export function createTestTransaction(): Transaction {
  const tx = new Transaction();
  
  // 添加一个简单的转账交易作为示例
  // 注意：这需要实际的 SUI 代币才能执行
  tx.transferObjects(
    [tx.gas], // 使用 gas 对象作为转账对象
    tx.pure.address('0x1234567890abcdef1234567890abcdef12345678') // 接收地址
  );
  
  return tx;
}

// 方法 6: 完整的交易执行流程示例
export async function executeTransactionExample(
  suiClient: SuiClient,
  useWallet: boolean = false,
  walletSignAndExecuteTransactionBlock?: (tx: unknown) => Promise<unknown>
) {
  try {
    // 创建测试交易
    const transaction = createTestTransaction();
    
    if (useWallet && walletSignAndExecuteTransactionBlock) {
      // 使用钱包签名 (生产环境推荐)
      console.log('使用钱包签名执行交易...');
      return await executeWithWallet(walletSignAndExecuteTransactionBlock, transaction);
    } else {
      // 使用 keypair 签名 (开发环境)
      console.log('使用 keypair 签名执行交易...');
      const keypair = createTestKeypair();
      return await executeWithRawSigner(suiClient, keypair, transaction);
    }
  } catch (error) {
    console.error('交易执行示例失败:', error);
    throw error;
  }
}

// 方法 7: 错误处理和重试机制
export async function executeWithRetry(
  suiClient: SuiClient,
  keypair: Ed25519Keypair,
  transaction: Transaction,
  maxRetries: number = 3
) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`尝试执行交易 (第 ${attempt} 次)...`);
      const result = await executeWithRawSigner(suiClient, keypair, transaction);
      console.log(`交易成功执行 (第 ${attempt} 次尝试)`);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`第 ${attempt} 次尝试失败:`, error);
      
      if (attempt < maxRetries) {
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw new Error(`交易执行失败，已重试 ${maxRetries} 次。最后错误: ${lastError?.message}`);
}

// 方法 8: 批量交易执行
export async function executeBatchTransactions(
  suiClient: SuiClient,
  keypair: Ed25519Keypair,
  transactions: Transaction[]
) {
  const results = [];
  
  for (let i = 0; i < transactions.length; i++) {
    try {
      console.log(`执行第 ${i + 1} 个交易...`);
      const result = await executeWithRawSigner(suiClient, keypair, transactions[i]);
      results.push({ index: i, success: true, result });
    } catch (error) {
      console.error(`第 ${i + 1} 个交易失败:`, error);
      results.push({ index: i, success: false, error });
    }
  }
  
  return results;
}
