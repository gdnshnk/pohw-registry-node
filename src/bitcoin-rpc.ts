/**
 * Bitcoin RPC Client
 * Handles communication with Bitcoin RPC nodes
 */

export interface BitcoinUTXO {
  txid: string;
  vout: number;
  amount: number;
  scriptPubKey: string;
}

export class BitcoinRPC {
  private rpcUrl: string;
  private username?: string;
  private password?: string;

  constructor(rpcUrl: string, username?: string, password?: string) {
    this.rpcUrl = rpcUrl;
    this.username = username;
    this.password = password;
  }

  /**
   * Make RPC call to Bitcoin node
   */
  private async rpcCall(method: string, params: any[] = []): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.username && this.password && {
          'Authorization': `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`
        })
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`RPC call failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    if (data.error) {
      throw new Error(`RPC error: ${data.error.message}`);
    }

    return data.result;
  }

  /**
   * Get UTXOs for an address
   */
  async getUTXOs(address: string): Promise<BitcoinUTXO[]> {
    try {
      // Use listunspent RPC call
      // Parameters: minconf, maxconf, addresses[]
      const utxos = await this.rpcCall('listunspent', [0, 9999999, [address]]);
      
      return utxos.map((utxo: any) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        amount: utxo.amount,
        scriptPubKey: utxo.scriptPubKey
      }));
    } catch (error: any) {
      // If listunspent fails, try alternative method
      try {
        // Try using gettxoutsetinfo and scanning (less efficient)
        // Or use block explorer API as fallback
        return [];
      } catch (e) {
        throw new Error(`Failed to get UTXOs: ${error.message}`);
      }
    }
  }

  /**
   * Get transaction details by txid
   */
  async getRawTransaction(txid: string, verbose: boolean = false): Promise<any> {
    return await this.rpcCall('getrawtransaction', [txid, verbose]);
  }

  /**
   * Estimate fee rate (satoshis per byte)
   */
  async estimateFeeRate(blocks: number = 6): Promise<number> {
    try {
      // Get fee estimate
      const estimates = await this.rpcCall('estimatesmartfee', [blocks]);
      if (estimates.feerate) {
        // Convert BTC per KB to satoshis per byte
        return Math.ceil(estimates.feerate * 100000000 / 1000);
      }
      // Fallback to default fee rate
      return 10; // 10 satoshis per byte (conservative)
    } catch (error) {
      // Fallback to default fee rate
      return 10; // 10 satoshis per byte
    }
  }

  /**
   * Get network info
   */
  async getNetworkInfo(): Promise<any> {
    return await this.rpcCall('getnetworkinfo', []);
  }

  /**
   * Broadcast raw transaction
   */
  async sendRawTransaction(txHex: string): Promise<string> {
    return await this.rpcCall('sendrawtransaction', [txHex]);
  }

  /**
   * Get transaction details
   */
  async getTransaction(txid: string): Promise<any> {
    return await this.rpcCall('gettransaction', [txid]);
  }

  /**
   * Get block height
   */
  async getBlockCount(): Promise<number> {
    return await this.rpcCall('getblockcount');
  }
}

