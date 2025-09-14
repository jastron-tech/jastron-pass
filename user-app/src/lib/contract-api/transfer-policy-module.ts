import { JASTRON_PASS } from '../sui-config';
import { BaseContract } from './base-contract';

export class TransferPolicyModule extends BaseContract {
  // Transfer Policy module functions
  async newPolicy(publisher: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.NEW_POLICY}`,
      arguments: [tx.object(publisher)],
    });
    return tx;
  }

  async addRoyaltyFeeRule(
    transferPolicy: string,
    transferPolicyCap: string,
    feeBp: number,
    minFee: number
  ) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.ADD_ROYALTY_FEE_RULE}`,
      arguments: [
        tx.object(transferPolicy),
        tx.object(transferPolicyCap),
        tx.pure.u64(feeBp),
        tx.pure.u64(minFee),
      ],
    });
    return tx;
  }

  async calculateRoyaltyFee(transferPolicy: string, price: number) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.CALCULATE_ROYALTY_FEE}`,
      arguments: [tx.object(transferPolicy), tx.pure.u64(price)],
    });
    return tx;
  }

  async addResellPriceLimitRule(
    transferPolicy: string,
    transferPolicyCap: string,
    priceLimitBp: number
  ) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.ADD_RESELL_PRICE_LIMIT_RULE}`,
      arguments: [
        tx.object(transferPolicy),
        tx.object(transferPolicyCap),
        tx.pure.u64(priceLimitBp),
      ],
    });
    return tx;
  }

  async calculateResellPriceLimit(transferPolicy: string, originalPrice: number) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.CALCULATE_RESELL_PRICE_LIMIT}`,
      arguments: [tx.object(transferPolicy), tx.pure.u64(originalPrice)],
    });
    return tx;
  }

  async addPlatformFeeRule(
    transferPolicy: string,
    transferPolicyCap: string,
    feeBp: number,
    minFee: number
  ) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.ADD_PLATFORM_FEE_RULE}`,
      arguments: [
        tx.object(transferPolicy),
        tx.object(transferPolicyCap),
        tx.pure.u64(feeBp),
        tx.pure.u64(minFee),
      ],
    });
    return tx;
  }

  async calculatePlatformFee(transferPolicy: string, price: number) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.CALCULATE_PLATFORM_FEE}`,
      arguments: [tx.object(transferPolicy), tx.pure.u64(price)],
    });
    return tx;
  }

  async calculateRoyaltyFeeValue(transferPolicy: string, price: number) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.CALCULATE_ROYALTY_FEE}`,
      arguments: [tx.object(transferPolicy), tx.pure.u64(price)],
    });
    return this.callReadonlyFunction(tx);
  }

  async calculatePlatformFeeValue(transferPolicy: string, price: number) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.CALCULATE_PLATFORM_FEE}`,
      arguments: [tx.object(transferPolicy), tx.pure.u64(price)],
    });
    return this.callReadonlyFunction(tx);
  }

  // Get rule functions (readonly)
  async getPlatformFeeRule(transferPolicy: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.GET_PLATFORM_FEE_RULE}`,
      arguments: [tx.object(transferPolicy)],
    });
    return tx;
  }

  async getRoyaltyFeeRule(transferPolicy: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.GET_ROYALTY_FEE_RULE}`,
      arguments: [tx.object(transferPolicy)],
    });
    return tx;
  }

  async getResellPriceLimitRule(transferPolicy: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.GET_RESELL_PRICE_LIMIT_RULE}`,
      arguments: [tx.object(transferPolicy)],
    });
    return tx;
  }

  // Readonly function calls that return values
  async getPlatformFeeRuleValue(transferPolicy: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.GET_PLATFORM_FEE_RULE}`,
      arguments: [tx.object(transferPolicy)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getRoyaltyFeeRuleValue(transferPolicy: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.GET_ROYALTY_FEE_RULE}`,
      arguments: [tx.object(transferPolicy)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getResellPriceLimitRuleValue(transferPolicy: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS.FUNCTIONS.GET_RESELL_PRICE_LIMIT_RULE}`,
      arguments: [tx.object(transferPolicy)],
    });
    return this.callReadonlyFunction(tx);
  }

  // Get TransferPolicyCap objects owned by an address
  async getTransferPolicyCaps(owner: string) {
    return this.getObjectsByOwner(owner);
  }

  // Get TransferPolicy from TransferPolicyCap
  async getTransferPolicyFromCap(transferPolicyCap: string) {
    // TransferPolicyCap has a policy_id field, not a function
    // We need to get the object and extract the policy_id field from its content
    const object = await this.getObject(transferPolicyCap);
    if (object.data?.content && 'fields' in object.data.content) {
      const fields = (object.data.content as Record<string, unknown>).fields as Record<string, string>;
      return {
        results: [{
          returnValues: [[fields.policy_id]]
        }]
      };
    }
    return { results: [] };
  }
}
