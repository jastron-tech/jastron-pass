import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toHex } from '@mysten/bcs';
import { SuiClient } from '@mysten/sui.js/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Sui utility functions
export function formatAddress(address: string, length: number = 4): string {
  if (!address) return '';
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function formatBalance(balance: string | number, decimals: number = 9): string {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  const formatted = (num / Math.pow(10, decimals)).toFixed(4);
  return `${formatted} SUI`;
}

export function isValidSuiAddress(address: string): boolean {
  if (!address) return false;
  // Basic validation for Sui address format
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function getRelativeTime(timestamp: number): string {
  // Use a fixed reference time to avoid hydration mismatch
  const now = 1700000000000; // Fixed timestamp for consistent SSR
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
  return Promise.resolve();
}

export function toHexString(byteArray: number[]) {
  const hexString = toHex(new Uint8Array(byteArray));
  // Pad or truncate to 64 characters for valid Sui object ID
  const paddedHex = hexString.padEnd(64, '0').substring(0, 64);
  const result = '0x' + paddedHex;
  return result;
}

// Generic function to parse LinkedTable and extract values
export async function parseLinkedTableValues<T = string>(
  parentNodeId: string, 
  suiClient: SuiClient,
  options?: {
    // Optional validation function to filter values
    validateValue?: (value: string, key: bigint) => Promise<boolean> | boolean;
    // Optional transformation function to convert values
    transformValue?: (value: string, key: bigint) => T;
    // Optional key type filter (default: 'u64')
    keyType?: string;
  },
  limit?: number,
  skip?: number,
): Promise<Array<{ key: bigint; value: T }>> {
  try {
    console.log(`Fetching dynamic fields for parent node: ${parentNodeId}`);
    
    const allKeysAndNodeIds: Array<{ key: bigint; nodeId: string }> = [];
    let cursor: string | null = null;
    let hasNextPage = true;
    const keyType = options?.keyType || 'u64';

    // 1. & 2. Fetch all dynamic fields (handling pagination)
    let hasSkipCount = 0;
    while (hasNextPage) {
      const dynamicFieldsPage = await suiClient.getDynamicFields({
        parentId: parentNodeId,
        cursor: cursor,
      });

      if (limit && allKeysAndNodeIds.length >= limit) {
        break;
      }
      for (const fieldInfo of dynamicFieldsPage.data) {
        if (fieldInfo.name.type === keyType) {
          if (skip && hasSkipCount < skip) {
            hasSkipCount++;
            continue;
          }
          allKeysAndNodeIds.push({
            key: BigInt(String(fieldInfo.name.value)), // The key
            nodeId: fieldInfo.objectId,      // The ID of the Node object
          });
        }
      }

      cursor = dynamicFieldsPage.nextCursor;
      hasNextPage = dynamicFieldsPage.hasNextPage;
    }

    console.log(`Found ${allKeysAndNodeIds.length} entries. Now fetching node objects...`);

    if (allKeysAndNodeIds.length === 0) {
      console.log('No dynamic fields found for parent object');
      return [];
    }

    // 3. Fetch the content of all Node objects in a single multi-get call for efficiency
    const nodeIds = allKeysAndNodeIds.map(item => item.nodeId);
    console.log('nodeIds:', nodeIds);
    const nodeObjects = await suiClient.multiGetObjects({
      ids: nodeIds,
      options: { showContent: true },
    });

    console.log('nodeObjects:', nodeObjects);

    // 4. Parse the Node objects to extract the final values
    const results: Array<{ key: bigint; value: T }> = [];

    for (const nodeObject of nodeObjects) {
      if (nodeObject.data?.content?.dataType === 'moveObject') {
        const fields = nodeObject.data.content.fields as Record<string, unknown>;
        // Note: The key isn't stored in the node, we have to map it back from our previous fetch
        const key = allKeysAndNodeIds.find(item => item.nodeId === nodeObject.data?.objectId)?.key;
        if (key !== undefined && fields.value) {
          // Navigate the nested structure: fields.value.fields.value
          const valueObj = fields.value as Record<string, unknown>;
          if (valueObj.fields && typeof valueObj.fields === 'object') {
            const innerFields = valueObj.fields as Record<string, unknown>;
            if (innerFields.value && typeof innerFields.value === 'string') {
              const rawValue = innerFields.value; // This is the actual value
              console.log('Raw value:', rawValue);
              
              // Apply validation if provided
              if (options?.validateValue) {
                const isValid = await options.validateValue(rawValue, key);
                if (!isValid) {
                  console.log(`Value ${rawValue} failed validation, skipping`);
                  continue;
                }
              }
              
              // Apply transformation if provided, otherwise use raw value
              const transformedValue = options?.transformValue 
                ? options.transformValue(rawValue, key)
                : (rawValue as T);
              
              results.push({ key, value: transformedValue });
              console.log(`Key: ${key.toString()}, Value: ${rawValue}`);
            }
          }
        }
      }
    }

    console.log('--- Parsed LinkedTable Content ---');
    console.log(`Found ${results.length} valid values`);
    
    return results;
  } catch (error) {
    console.error('Failed to parse LinkedTable:', error);
    return [];
  }
}

