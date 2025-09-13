'use client';

import { useMemo } from 'react';
import { useNetwork } from '../context/network-context';
import { getLatestPackageId, getPlatformId, getPublisherId } from './sui-config';

export function useContractIds() {
  const { currentNetwork } = useNetwork();

  const contractIds = useMemo(() => {
    return {
      latestPackageId: getLatestPackageId(currentNetwork),
      platformId: getPlatformId(currentNetwork),
      publisherId: getPublisherId(currentNetwork),
      network: currentNetwork,
    };
  }, [currentNetwork]);

  return contractIds;
}
