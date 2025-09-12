'use client';

import { useMemo } from 'react';
import { useNetwork } from './network-context';
import { JastronPassContract } from './contract-utils';

export function useContract() {
  const { currentNetwork } = useNetwork();

  const contract = useMemo(() => {
    return new JastronPassContract(currentNetwork);
  }, [currentNetwork]);

  return contract;
}
