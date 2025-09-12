'use client';

import { useMemo } from 'react';
import { useNetwork } from './network-context';
import { getPackageId, getPlatformId, getPublisherId } from './sui-config';

export function useContractIds() {
  const { currentNetwork } = useNetwork();

  const contractIds = useMemo(() => {
    return {
      packageId: getPackageId(currentNetwork),
      platformId: getPlatformId(currentNetwork),
      publisherId: getPublisherId(currentNetwork),
      network: currentNetwork,
    };
  }, [currentNetwork]);

  return contractIds;
}
