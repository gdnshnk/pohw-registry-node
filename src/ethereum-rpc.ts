/**
 * Ethereum RPC Utilities
 * Helper functions for Ethereum interactions
 */

import { ethers } from 'ethers';

/**
 * Get block number for a transaction
 */
export async function getBlockNumber(
  provider: ethers.Provider,
  txHash: string
): Promise<number | null> {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt ? Number(receipt.blockNumber) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForConfirmation(
  provider: ethers.Provider,
  txHash: string,
  confirmations: number = 1
): Promise<ethers.TransactionReceipt | null> {
  try {
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    return receipt;
  } catch (error) {
    return null;
  }
}

/**
 * Check if address has sufficient balance
 */
export async function hasSufficientBalance(
  provider: ethers.Provider,
  address: string,
  requiredAmount: bigint
): Promise<boolean> {
  try {
    const balance = await provider.getBalance(address);
    return balance >= requiredAmount;
  } catch (error) {
    return false;
  }
}

