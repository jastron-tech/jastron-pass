import { Transaction } from '@mysten/sui/transactions';
import { GAS_CONFIG, getPackageId, getPlatformId, getPublisherId, SuiNetwork } from '../sui-config';
import { getSuiClient } from '../sui-client';

// Base contract class with common functionality
export abstract class BaseContract {
  protected packageId: string;
  protected platformId: string;
  protected publisherId: string;
  protected client: ReturnType<typeof getSuiClient>;

  constructor(network: SuiNetwork) {
    this.packageId = getPackageId(network);
    this.platformId = getPlatformId(network);
    this.publisherId = getPublisherId(network);
    this.client = getSuiClient(network);
  }

  // Create transaction
  protected createTransaction(): Transaction {
    const tx = new Transaction();
    tx.setGasBudget(GAS_CONFIG.DEFAULT_BUDGET);
    return tx;
  }

  // Helper method for readonly functions
  protected async callReadonlyFunction(tx: Transaction) {
    try {
      return await this.client.devInspectTransactionBlock({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transactionBlock: tx as any, // Type assertion for compatibility between Transaction and TransactionBlock
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000', // dummy address for readonly calls
      });
    } catch (error) {
      console.error('Failed to call readonly function:', error);
      throw error;
    }
  }

  // Get object by ID
  async getObject(objectId: string) {
    try {
      return await this.client.getObject({
        id: objectId,
        options: {
          showContent: true,
          showDisplay: true,
          showType: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
        },
      });
    } catch (error) {
      console.error('Failed to get object:', error);
      throw error;
    }
  }

  // Get objects by owner
  async getObjectsByOwner(owner: string) {
    try {
      return await this.client.getOwnedObjects({
        owner,
        options: {
          showContent: true,
          showDisplay: true,
          showType: true,
          showOwner: true,
        },
      });
    } catch (error) {
      console.error('Failed to get objects by owner:', error);
      throw error;
    }
  }

  // Get events
  async getEvents(module: string, eventType?: string) {
    try {
      const query = {
        MoveModule: {
          package: this.packageId,
          module,
        },
      };
      
      if (eventType) {
        (query as Record<string, unknown>).MoveEventType = `${this.packageId}::${module}::${eventType}`;
      }

      return await this.client.queryEvents({
        query,
        limit: 50,
        order: 'descending',
      });
    } catch (error) {
      console.error('Failed to get events:', error);
      throw error;
    }
  }
}
