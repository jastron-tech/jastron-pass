import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toHex } from '@mysten/bcs';

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