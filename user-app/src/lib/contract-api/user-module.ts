import { JASTRON_PASS } from '../sui-config';
import { BaseContract } from './base-contract';

export class UserModule extends BaseContract {
  // User module functions (readonly)
  async getUserProfileId(userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.USER}::${JASTRON_PASS.FUNCTIONS.USER_GET_PROFILE_ID}`,
      arguments: [tx.object(userProfile)],
    });
    return tx;
  }

  async getUserTreasury(userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.USER}::${JASTRON_PASS.FUNCTIONS.USER_GET_TREASURY}`,
      arguments: [tx.object(userProfile)],
    });
    return tx;
  }

  async hasUserAttendedActivity(userProfile: string, activityId: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.USER}::${JASTRON_PASS.FUNCTIONS.USER_HAS_ATTENDED_ACTIVITY}`,
      arguments: [tx.object(userProfile), tx.pure.string(activityId)],
    });
    return tx;
  }

  async getAttendedActivitiesCount(userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.USER}::${JASTRON_PASS.FUNCTIONS.USER_GET_ATTENDED_ACTIVITIES_COUNT}`,
      arguments: [tx.object(userProfile)],
    });
    return tx;
  }

  async getAttendedAt(userProfile: string, activityId: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.USER}::${JASTRON_PASS.FUNCTIONS.USER_GET_ATTENDED_AT}`,
      arguments: [tx.object(userProfile), tx.pure.string(activityId)],
    });
    return tx;
  }

  // User readonly function calls
  async hasUserAttendedActivityValue(userProfile: string, activityId: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.USER}::${JASTRON_PASS.FUNCTIONS.USER_HAS_ATTENDED_ACTIVITY}`,
      arguments: [tx.object(userProfile), tx.pure.string(activityId)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getAttendedActivitiesCountValue(userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.USER}::${JASTRON_PASS.FUNCTIONS.USER_GET_ATTENDED_ACTIVITIES_COUNT}`,
      arguments: [tx.object(userProfile)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getAttendedAtValue(userProfile: string, activityId: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.USER}::${JASTRON_PASS.FUNCTIONS.USER_GET_ATTENDED_AT}`,
      arguments: [tx.object(userProfile), tx.pure.string(activityId)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getUserProfileIdValue(userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.USER}::${JASTRON_PASS.FUNCTIONS.USER_GET_PROFILE_ID}`,
      arguments: [tx.object(userProfile)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getUserTreasuryValue(userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.USER}::${JASTRON_PASS.FUNCTIONS.USER_GET_TREASURY}`,
      arguments: [tx.object(userProfile)],
    });
    return this.callReadonlyFunction(tx);
  }
}
