/**
 * Bitcoin Block Explorer API Client
 * Fallback option when RPC is not available
 * Uses blockstream.info API for testnet/mainnet
 */

export interface ExplorerUTXO {
  txid: string;
  vout: number;
  value: number;
  scriptpubkey: string;
}

export class BitcoinExplorerAPI {
  private baseUrl: string;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.baseUrl = network === 'testnet' 
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
  }

  /**
   * Get UTXOs for an address
   */
  async getUTXOs(address: string): Promise<ExplorerUTXO[]> {
    try {
      const response = await fetch(`${this.baseUrl}/address/${address}/utxo`);
      if (!response.ok) {
        throw new Error(`Explorer API error: ${response.statusText}`);
      }
      const utxos = await response.json() as any[];
      
      return utxos.map((utxo: any) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value, // Already in satoshis
        scriptpubkey: utxo.scriptpubkey
      }));
    } catch (error: any) {
      throw new Error(`Failed to get UTXOs from explorer: ${error.message}`);
    }
  }

  /**
   * Get transaction hex
   */
  async getTransactionHex(txid: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/tx/${txid}/hex`);
      if (!response.ok) {
        throw new Error(`Explorer API error: ${response.statusText}`);
      }
      return await response.text();
    } catch (error: any) {
      throw new Error(`Failed to get transaction hex: ${error.message}`);
    }
  }

  /**
   * Broadcast transaction
   */
  async broadcastTransaction(txHex: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/tx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: txHex
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Broadcast failed: ${errorText}`);
      }

      const txid = await response.text();
      return txid.trim();
    } catch (error: any) {
      throw new Error(`Failed to broadcast transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txid: string): Promise<{ confirmed: boolean; blockHeight?: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/tx/${txid}`);
      if (!response.ok) {
        return { confirmed: false };
      }
      const tx: any = await response.json();
      return {
        confirmed: tx.status?.confirmed || false,
        blockHeight: tx.status?.block_height
      };
    } catch (error) {
      return { confirmed: false };
    }
  }
}

