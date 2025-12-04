/**
 * Check Testnet Balances
 * Checks Bitcoin testnet and Ethereum Sepolia balances
 */

const { ethers } = require('ethers');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { ECPairFactory } = require('ecpair');

// Initialize ECC library
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

// Get configuration from environment
const BITCOIN_NETWORK = process.env.BITCOIN_NETWORK || 'testnet';
const BITCOIN_PRIVATE_KEY = process.env.BITCOIN_PRIVATE_KEY;
const ETHEREUM_NETWORK = process.env.ETHEREUM_NETWORK || 'sepolia';
const ETHEREUM_PRIVATE_KEY = process.env.ETHEREUM_PRIVATE_KEY;
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://rpc.sepolia.org';

/**
 * Get Bitcoin address from private key
 */
function getBitcoinAddress(privateKeyWIF, network = 'testnet') {
  try {
    const keyPair = ECPair.fromWIF(privateKeyWIF, bitcoin.networks[network]);
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: keyPair.publicKey, 
      network: bitcoin.networks[network] 
    });
    return address;
  } catch (error) {
    console.error('Error deriving Bitcoin address:', error.message);
    return null;
  }
}

/**
 * Get Bitcoin balance from block explorer
 */
async function getBitcoinBalance(address, network = 'testnet') {
  try {
    const baseUrl = network === 'testnet' 
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
    
    const response = await fetch(`${baseUrl}/address/${address}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const balanceSatoshis = data.chain_stats?.funded_txo_sum || 0;
    const spentSatoshis = data.chain_stats?.spent_txo_sum || 0;
    const balance = (balanceSatoshis - spentSatoshis) / 100000000; // Convert to BTC
    
    return {
      balance,
      balanceSatoshis: balanceSatoshis - spentSatoshis,
      address,
      network
    };
  } catch (error) {
    console.error('Error fetching Bitcoin balance:', error.message);
    return null;
  }
}

/**
 * Get Ethereum address from private key
 */
function getEthereumAddress(privateKeyHex) {
  try {
    // Remove 0x prefix if present
    const key = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
    const wallet = new ethers.Wallet(key);
    return wallet.address;
  } catch (error) {
    console.error('Error deriving Ethereum address:', error.message);
    return null;
  }
}

/**
 * Get Ethereum balance (using Etherscan API for Sepolia)
 */
async function getEthereumBalance(address, network = 'sepolia') {
  try {
    // Try Etherscan API first (faster, no RPC needed)
    if (network === 'sepolia') {
      try {
        const response = await fetch(`https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`);
        const data = await response.json();
        if (data.status === '1' && data.result) {
          const balanceWei = BigInt(data.result);
          const balanceEth = ethers.formatEther(balanceWei.toString());
          return {
            balance: parseFloat(balanceEth),
            balanceWei: balanceWei.toString(),
            address,
            network
          };
        }
      } catch (e) {
        // Fall through to RPC method
      }
    }
    
    // Fallback to RPC
    const rpcUrl = ETHEREUM_RPC_URL || 'https://rpc.sepolia.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);
    
    return {
      balance: parseFloat(balanceEth),
      balanceWei: balance.toString(),
      address,
      network
    };
  } catch (error) {
    console.error('Error fetching Ethereum balance:', error.message);
    return null;
  }
}

/**
 * Main function
 */
async function checkBalances() {
  console.log('💰 Checking Testnet Balances\n');
  console.log('='.repeat(70));
  
  let hasAnyBalance = false;
  
  // Check Bitcoin
  if (BITCOIN_PRIVATE_KEY) {
    console.log('\n📊 Bitcoin Testnet:');
    console.log('─'.repeat(70));
    
    const btcAddress = getBitcoinAddress(BITCOIN_PRIVATE_KEY, BITCOIN_NETWORK);
    if (btcAddress) {
      console.log(`   Address: ${btcAddress}`);
      console.log(`   Network: ${BITCOIN_NETWORK}`);
      
      const btcBalance = await getBitcoinBalance(btcAddress, BITCOIN_NETWORK);
      if (btcBalance) {
        console.log(`   Balance: ${btcBalance.balance.toFixed(8)} BTC`);
        console.log(`   Balance: ${btcBalance.balanceSatoshis} satoshis`);
        console.log(`   Explorer: https://blockstream.info/${BITCOIN_NETWORK === 'testnet' ? 'testnet/' : ''}address/${btcAddress}`);
        
        if (btcBalance.balance > 0) {
          hasAnyBalance = true;
        }
      } else {
        console.log('   ❌ Could not fetch balance');
      }
    } else {
      console.log('   ❌ Could not derive address from private key');
    }
  } else {
    console.log('\n📊 Bitcoin Testnet:');
    console.log('─'.repeat(70));
    console.log('   ⚠️  BITCOIN_PRIVATE_KEY not set in environment');
  }
  
  // Check Ethereum
  if (ETHEREUM_PRIVATE_KEY) {
    console.log('\n📊 Ethereum Sepolia:');
    console.log('─'.repeat(70));
    
    const ethAddress = getEthereumAddress(ETHEREUM_PRIVATE_KEY);
    if (ethAddress) {
      console.log(`   Address: ${ethAddress}`);
      console.log(`   Network: ${ETHEREUM_NETWORK}`);
      console.log(`   RPC: ${ETHEREUM_RPC_URL.replace(/\/v3\/[^/]+/, '/v3/***')}`);
      
      const ethBalance = await getEthereumBalance(ethAddress, ETHEREUM_NETWORK);
      if (ethBalance) {
        console.log(`   Balance: ${ethBalance.balance.toFixed(6)} ETH`);
        console.log(`   Balance: ${ethBalance.balanceWei} wei`);
        console.log(`   Explorer: https://sepolia.etherscan.io/address/${ethAddress}`);
        
        if (ethBalance.balance > 0) {
          hasAnyBalance = true;
        }
      } else {
        console.log('   ❌ Could not fetch balance');
      }
    } else {
      console.log('   ❌ Could not derive address from private key');
    }
  } else {
    console.log('\n📊 Ethereum Sepolia:');
    console.log('─'.repeat(70));
    console.log('   ⚠️  ETHEREUM_PRIVATE_KEY not set in environment');
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (!hasAnyBalance && (BITCOIN_PRIVATE_KEY || ETHEREUM_PRIVATE_KEY)) {
    console.log('\n⚠️  No balances found. Get testnet coins from:');
    if (BITCOIN_PRIVATE_KEY) {
      console.log('   Bitcoin Testnet: https://testnet-faucet.mempool.co/');
    }
    if (ETHEREUM_PRIVATE_KEY) {
      console.log('   Ethereum Sepolia: https://sepoliafaucet.com/');
    }
  }
  
  console.log('');
}

// Run if called directly
if (require.main === module) {
  checkBalances().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { checkBalances, getBitcoinAddress, getEthereumAddress };


 * Checks Bitcoin testnet and Ethereum Sepolia balances
 */

const { ethers } = require('ethers');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { ECPairFactory } = require('ecpair');

// Initialize ECC library
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

// Get configuration from environment
const BITCOIN_NETWORK = process.env.BITCOIN_NETWORK || 'testnet';
const BITCOIN_PRIVATE_KEY = process.env.BITCOIN_PRIVATE_KEY;
const ETHEREUM_NETWORK = process.env.ETHEREUM_NETWORK || 'sepolia';
const ETHEREUM_PRIVATE_KEY = process.env.ETHEREUM_PRIVATE_KEY;
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://rpc.sepolia.org';

/**
 * Get Bitcoin address from private key
 */
function getBitcoinAddress(privateKeyWIF, network = 'testnet') {
  try {
    const keyPair = ECPair.fromWIF(privateKeyWIF, bitcoin.networks[network]);
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: keyPair.publicKey, 
      network: bitcoin.networks[network] 
    });
    return address;
  } catch (error) {
    console.error('Error deriving Bitcoin address:', error.message);
    return null;
  }
}

/**
 * Get Bitcoin balance from block explorer
 */
async function getBitcoinBalance(address, network = 'testnet') {
  try {
    const baseUrl = network === 'testnet' 
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
    
    const response = await fetch(`${baseUrl}/address/${address}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const balanceSatoshis = data.chain_stats?.funded_txo_sum || 0;
    const spentSatoshis = data.chain_stats?.spent_txo_sum || 0;
    const balance = (balanceSatoshis - spentSatoshis) / 100000000; // Convert to BTC
    
    return {
      balance,
      balanceSatoshis: balanceSatoshis - spentSatoshis,
      address,
      network
    };
  } catch (error) {
    console.error('Error fetching Bitcoin balance:', error.message);
    return null;
  }
}

/**
 * Get Ethereum address from private key
 */
function getEthereumAddress(privateKeyHex) {
  try {
    // Remove 0x prefix if present
    const key = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
    const wallet = new ethers.Wallet(key);
    return wallet.address;
  } catch (error) {
    console.error('Error deriving Ethereum address:', error.message);
    return null;
  }
}

/**
 * Get Ethereum balance (using Etherscan API for Sepolia)
 */
async function getEthereumBalance(address, network = 'sepolia') {
  try {
    // Try Etherscan API first (faster, no RPC needed)
    if (network === 'sepolia') {
      try {
        const response = await fetch(`https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`);
        const data = await response.json();
        if (data.status === '1' && data.result) {
          const balanceWei = BigInt(data.result);
          const balanceEth = ethers.formatEther(balanceWei.toString());
          return {
            balance: parseFloat(balanceEth),
            balanceWei: balanceWei.toString(),
            address,
            network
          };
        }
      } catch (e) {
        // Fall through to RPC method
      }
    }
    
    // Fallback to RPC
    const rpcUrl = ETHEREUM_RPC_URL || 'https://rpc.sepolia.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);
    
    return {
      balance: parseFloat(balanceEth),
      balanceWei: balance.toString(),
      address,
      network
    };
  } catch (error) {
    console.error('Error fetching Ethereum balance:', error.message);
    return null;
  }
}

/**
 * Main function
 */
async function checkBalances() {
  console.log('💰 Checking Testnet Balances\n');
  console.log('='.repeat(70));
  
  let hasAnyBalance = false;
  
  // Check Bitcoin
  if (BITCOIN_PRIVATE_KEY) {
    console.log('\n📊 Bitcoin Testnet:');
    console.log('─'.repeat(70));
    
    const btcAddress = getBitcoinAddress(BITCOIN_PRIVATE_KEY, BITCOIN_NETWORK);
    if (btcAddress) {
      console.log(`   Address: ${btcAddress}`);
      console.log(`   Network: ${BITCOIN_NETWORK}`);
      
      const btcBalance = await getBitcoinBalance(btcAddress, BITCOIN_NETWORK);
      if (btcBalance) {
        console.log(`   Balance: ${btcBalance.balance.toFixed(8)} BTC`);
        console.log(`   Balance: ${btcBalance.balanceSatoshis} satoshis`);
        console.log(`   Explorer: https://blockstream.info/${BITCOIN_NETWORK === 'testnet' ? 'testnet/' : ''}address/${btcAddress}`);
        
        if (btcBalance.balance > 0) {
          hasAnyBalance = true;
        }
      } else {
        console.log('   ❌ Could not fetch balance');
      }
    } else {
      console.log('   ❌ Could not derive address from private key');
    }
  } else {
    console.log('\n📊 Bitcoin Testnet:');
    console.log('─'.repeat(70));
    console.log('   ⚠️  BITCOIN_PRIVATE_KEY not set in environment');
  }
  
  // Check Ethereum
  if (ETHEREUM_PRIVATE_KEY) {
    console.log('\n📊 Ethereum Sepolia:');
    console.log('─'.repeat(70));
    
    const ethAddress = getEthereumAddress(ETHEREUM_PRIVATE_KEY);
    if (ethAddress) {
      console.log(`   Address: ${ethAddress}`);
      console.log(`   Network: ${ETHEREUM_NETWORK}`);
      console.log(`   RPC: ${ETHEREUM_RPC_URL.replace(/\/v3\/[^/]+/, '/v3/***')}`);
      
      const ethBalance = await getEthereumBalance(ethAddress, ETHEREUM_NETWORK);
      if (ethBalance) {
        console.log(`   Balance: ${ethBalance.balance.toFixed(6)} ETH`);
        console.log(`   Balance: ${ethBalance.balanceWei} wei`);
        console.log(`   Explorer: https://sepolia.etherscan.io/address/${ethAddress}`);
        
        if (ethBalance.balance > 0) {
          hasAnyBalance = true;
        }
      } else {
        console.log('   ❌ Could not fetch balance');
      }
    } else {
      console.log('   ❌ Could not derive address from private key');
    }
  } else {
    console.log('\n📊 Ethereum Sepolia:');
    console.log('─'.repeat(70));
    console.log('   ⚠️  ETHEREUM_PRIVATE_KEY not set in environment');
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (!hasAnyBalance && (BITCOIN_PRIVATE_KEY || ETHEREUM_PRIVATE_KEY)) {
    console.log('\n⚠️  No balances found. Get testnet coins from:');
    if (BITCOIN_PRIVATE_KEY) {
      console.log('   Bitcoin Testnet: https://testnet-faucet.mempool.co/');
    }
    if (ETHEREUM_PRIVATE_KEY) {
      console.log('   Ethereum Sepolia: https://sepoliafaucet.com/');
    }
  }
  
  console.log('');
}

// Run if called directly
if (require.main === module) {
  checkBalances().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { checkBalances, getBitcoinAddress, getEthereumAddress };


 * Checks Bitcoin testnet and Ethereum Sepolia balances
 */

const { ethers } = require('ethers');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { ECPairFactory } = require('ecpair');

// Initialize ECC library
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

// Get configuration from environment
const BITCOIN_NETWORK = process.env.BITCOIN_NETWORK || 'testnet';
const BITCOIN_PRIVATE_KEY = process.env.BITCOIN_PRIVATE_KEY;
const ETHEREUM_NETWORK = process.env.ETHEREUM_NETWORK || 'sepolia';
const ETHEREUM_PRIVATE_KEY = process.env.ETHEREUM_PRIVATE_KEY;
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://rpc.sepolia.org';

/**
 * Get Bitcoin address from private key
 */
function getBitcoinAddress(privateKeyWIF, network = 'testnet') {
  try {
    const keyPair = ECPair.fromWIF(privateKeyWIF, bitcoin.networks[network]);
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: keyPair.publicKey, 
      network: bitcoin.networks[network] 
    });
    return address;
  } catch (error) {
    console.error('Error deriving Bitcoin address:', error.message);
    return null;
  }
}

/**
 * Get Bitcoin balance from block explorer
 */
async function getBitcoinBalance(address, network = 'testnet') {
  try {
    const baseUrl = network === 'testnet' 
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
    
    const response = await fetch(`${baseUrl}/address/${address}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const balanceSatoshis = data.chain_stats?.funded_txo_sum || 0;
    const spentSatoshis = data.chain_stats?.spent_txo_sum || 0;
    const balance = (balanceSatoshis - spentSatoshis) / 100000000; // Convert to BTC
    
    return {
      balance,
      balanceSatoshis: balanceSatoshis - spentSatoshis,
      address,
      network
    };
  } catch (error) {
    console.error('Error fetching Bitcoin balance:', error.message);
    return null;
  }
}

/**
 * Get Ethereum address from private key
 */
function getEthereumAddress(privateKeyHex) {
  try {
    // Remove 0x prefix if present
    const key = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
    const wallet = new ethers.Wallet(key);
    return wallet.address;
  } catch (error) {
    console.error('Error deriving Ethereum address:', error.message);
    return null;
  }
}

/**
 * Get Ethereum balance (using Etherscan API for Sepolia)
 */
async function getEthereumBalance(address, network = 'sepolia') {
  try {
    // Try Etherscan API first (faster, no RPC needed)
    if (network === 'sepolia') {
      try {
        const response = await fetch(`https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`);
        const data = await response.json();
        if (data.status === '1' && data.result) {
          const balanceWei = BigInt(data.result);
          const balanceEth = ethers.formatEther(balanceWei.toString());
          return {
            balance: parseFloat(balanceEth),
            balanceWei: balanceWei.toString(),
            address,
            network
          };
        }
      } catch (e) {
        // Fall through to RPC method
      }
    }
    
    // Fallback to RPC
    const rpcUrl = ETHEREUM_RPC_URL || 'https://rpc.sepolia.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);
    
    return {
      balance: parseFloat(balanceEth),
      balanceWei: balance.toString(),
      address,
      network
    };
  } catch (error) {
    console.error('Error fetching Ethereum balance:', error.message);
    return null;
  }
}

/**
 * Main function
 */
async function checkBalances() {
  console.log('💰 Checking Testnet Balances\n');
  console.log('='.repeat(70));
  
  let hasAnyBalance = false;
  
  // Check Bitcoin
  if (BITCOIN_PRIVATE_KEY) {
    console.log('\n📊 Bitcoin Testnet:');
    console.log('─'.repeat(70));
    
    const btcAddress = getBitcoinAddress(BITCOIN_PRIVATE_KEY, BITCOIN_NETWORK);
    if (btcAddress) {
      console.log(`   Address: ${btcAddress}`);
      console.log(`   Network: ${BITCOIN_NETWORK}`);
      
      const btcBalance = await getBitcoinBalance(btcAddress, BITCOIN_NETWORK);
      if (btcBalance) {
        console.log(`   Balance: ${btcBalance.balance.toFixed(8)} BTC`);
        console.log(`   Balance: ${btcBalance.balanceSatoshis} satoshis`);
        console.log(`   Explorer: https://blockstream.info/${BITCOIN_NETWORK === 'testnet' ? 'testnet/' : ''}address/${btcAddress}`);
        
        if (btcBalance.balance > 0) {
          hasAnyBalance = true;
        }
      } else {
        console.log('   ❌ Could not fetch balance');
      }
    } else {
      console.log('   ❌ Could not derive address from private key');
    }
  } else {
    console.log('\n📊 Bitcoin Testnet:');
    console.log('─'.repeat(70));
    console.log('   ⚠️  BITCOIN_PRIVATE_KEY not set in environment');
  }
  
  // Check Ethereum
  if (ETHEREUM_PRIVATE_KEY) {
    console.log('\n📊 Ethereum Sepolia:');
    console.log('─'.repeat(70));
    
    const ethAddress = getEthereumAddress(ETHEREUM_PRIVATE_KEY);
    if (ethAddress) {
      console.log(`   Address: ${ethAddress}`);
      console.log(`   Network: ${ETHEREUM_NETWORK}`);
      console.log(`   RPC: ${ETHEREUM_RPC_URL.replace(/\/v3\/[^/]+/, '/v3/***')}`);
      
      const ethBalance = await getEthereumBalance(ethAddress, ETHEREUM_NETWORK);
      if (ethBalance) {
        console.log(`   Balance: ${ethBalance.balance.toFixed(6)} ETH`);
        console.log(`   Balance: ${ethBalance.balanceWei} wei`);
        console.log(`   Explorer: https://sepolia.etherscan.io/address/${ethAddress}`);
        
        if (ethBalance.balance > 0) {
          hasAnyBalance = true;
        }
      } else {
        console.log('   ❌ Could not fetch balance');
      }
    } else {
      console.log('   ❌ Could not derive address from private key');
    }
  } else {
    console.log('\n📊 Ethereum Sepolia:');
    console.log('─'.repeat(70));
    console.log('   ⚠️  ETHEREUM_PRIVATE_KEY not set in environment');
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (!hasAnyBalance && (BITCOIN_PRIVATE_KEY || ETHEREUM_PRIVATE_KEY)) {
    console.log('\n⚠️  No balances found. Get testnet coins from:');
    if (BITCOIN_PRIVATE_KEY) {
      console.log('   Bitcoin Testnet: https://testnet-faucet.mempool.co/');
    }
    if (ETHEREUM_PRIVATE_KEY) {
      console.log('   Ethereum Sepolia: https://sepoliafaucet.com/');
    }
  }
  
  console.log('');
}

// Run if called directly
if (require.main === module) {
  checkBalances().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { checkBalances, getBitcoinAddress, getEthereumAddress };


 * Checks Bitcoin testnet and Ethereum Sepolia balances
 */

const { ethers } = require('ethers');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { ECPairFactory } = require('ecpair');

// Initialize ECC library
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

// Get configuration from environment
const BITCOIN_NETWORK = process.env.BITCOIN_NETWORK || 'testnet';
const BITCOIN_PRIVATE_KEY = process.env.BITCOIN_PRIVATE_KEY;
const ETHEREUM_NETWORK = process.env.ETHEREUM_NETWORK || 'sepolia';
const ETHEREUM_PRIVATE_KEY = process.env.ETHEREUM_PRIVATE_KEY;
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://rpc.sepolia.org';

/**
 * Get Bitcoin address from private key
 */
function getBitcoinAddress(privateKeyWIF, network = 'testnet') {
  try {
    const keyPair = ECPair.fromWIF(privateKeyWIF, bitcoin.networks[network]);
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: keyPair.publicKey, 
      network: bitcoin.networks[network] 
    });
    return address;
  } catch (error) {
    console.error('Error deriving Bitcoin address:', error.message);
    return null;
  }
}

/**
 * Get Bitcoin balance from block explorer
 */
async function getBitcoinBalance(address, network = 'testnet') {
  try {
    const baseUrl = network === 'testnet' 
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
    
    const response = await fetch(`${baseUrl}/address/${address}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const balanceSatoshis = data.chain_stats?.funded_txo_sum || 0;
    const spentSatoshis = data.chain_stats?.spent_txo_sum || 0;
    const balance = (balanceSatoshis - spentSatoshis) / 100000000; // Convert to BTC
    
    return {
      balance,
      balanceSatoshis: balanceSatoshis - spentSatoshis,
      address,
      network
    };
  } catch (error) {
    console.error('Error fetching Bitcoin balance:', error.message);
    return null;
  }
}

/**
 * Get Ethereum address from private key
 */
function getEthereumAddress(privateKeyHex) {
  try {
    // Remove 0x prefix if present
    const key = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
    const wallet = new ethers.Wallet(key);
    return wallet.address;
  } catch (error) {
    console.error('Error deriving Ethereum address:', error.message);
    return null;
  }
}

/**
 * Get Ethereum balance (using Etherscan API for Sepolia)
 */
async function getEthereumBalance(address, network = 'sepolia') {
  try {
    // Try Etherscan API first (faster, no RPC needed)
    if (network === 'sepolia') {
      try {
        const response = await fetch(`https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`);
        const data = await response.json();
        if (data.status === '1' && data.result) {
          const balanceWei = BigInt(data.result);
          const balanceEth = ethers.formatEther(balanceWei.toString());
          return {
            balance: parseFloat(balanceEth),
            balanceWei: balanceWei.toString(),
            address,
            network
          };
        }
      } catch (e) {
        // Fall through to RPC method
      }
    }
    
    // Fallback to RPC
    const rpcUrl = ETHEREUM_RPC_URL || 'https://rpc.sepolia.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);
    
    return {
      balance: parseFloat(balanceEth),
      balanceWei: balance.toString(),
      address,
      network
    };
  } catch (error) {
    console.error('Error fetching Ethereum balance:', error.message);
    return null;
  }
}

/**
 * Main function
 */
async function checkBalances() {
  console.log('💰 Checking Testnet Balances\n');
  console.log('='.repeat(70));
  
  let hasAnyBalance = false;
  
  // Check Bitcoin
  if (BITCOIN_PRIVATE_KEY) {
    console.log('\n📊 Bitcoin Testnet:');
    console.log('─'.repeat(70));
    
    const btcAddress = getBitcoinAddress(BITCOIN_PRIVATE_KEY, BITCOIN_NETWORK);
    if (btcAddress) {
      console.log(`   Address: ${btcAddress}`);
      console.log(`   Network: ${BITCOIN_NETWORK}`);
      
      const btcBalance = await getBitcoinBalance(btcAddress, BITCOIN_NETWORK);
      if (btcBalance) {
        console.log(`   Balance: ${btcBalance.balance.toFixed(8)} BTC`);
        console.log(`   Balance: ${btcBalance.balanceSatoshis} satoshis`);
        console.log(`   Explorer: https://blockstream.info/${BITCOIN_NETWORK === 'testnet' ? 'testnet/' : ''}address/${btcAddress}`);
        
        if (btcBalance.balance > 0) {
          hasAnyBalance = true;
        }
      } else {
        console.log('   ❌ Could not fetch balance');
      }
    } else {
      console.log('   ❌ Could not derive address from private key');
    }
  } else {
    console.log('\n📊 Bitcoin Testnet:');
    console.log('─'.repeat(70));
    console.log('   ⚠️  BITCOIN_PRIVATE_KEY not set in environment');
  }
  
  // Check Ethereum
  if (ETHEREUM_PRIVATE_KEY) {
    console.log('\n📊 Ethereum Sepolia:');
    console.log('─'.repeat(70));
    
    const ethAddress = getEthereumAddress(ETHEREUM_PRIVATE_KEY);
    if (ethAddress) {
      console.log(`   Address: ${ethAddress}`);
      console.log(`   Network: ${ETHEREUM_NETWORK}`);
      console.log(`   RPC: ${ETHEREUM_RPC_URL.replace(/\/v3\/[^/]+/, '/v3/***')}`);
      
      const ethBalance = await getEthereumBalance(ethAddress, ETHEREUM_NETWORK);
      if (ethBalance) {
        console.log(`   Balance: ${ethBalance.balance.toFixed(6)} ETH`);
        console.log(`   Balance: ${ethBalance.balanceWei} wei`);
        console.log(`   Explorer: https://sepolia.etherscan.io/address/${ethAddress}`);
        
        if (ethBalance.balance > 0) {
          hasAnyBalance = true;
        }
      } else {
        console.log('   ❌ Could not fetch balance');
      }
    } else {
      console.log('   ❌ Could not derive address from private key');
    }
  } else {
    console.log('\n📊 Ethereum Sepolia:');
    console.log('─'.repeat(70));
    console.log('   ⚠️  ETHEREUM_PRIVATE_KEY not set in environment');
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (!hasAnyBalance && (BITCOIN_PRIVATE_KEY || ETHEREUM_PRIVATE_KEY)) {
    console.log('\n⚠️  No balances found. Get testnet coins from:');
    if (BITCOIN_PRIVATE_KEY) {
      console.log('   Bitcoin Testnet: https://testnet-faucet.mempool.co/');
    }
    if (ETHEREUM_PRIVATE_KEY) {
      console.log('   Ethereum Sepolia: https://sepoliafaucet.com/');
    }
  }
  
  console.log('');
}

// Run if called directly
if (require.main === module) {
  checkBalances().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { checkBalances, getBitcoinAddress, getEthereumAddress };


 * Checks Bitcoin testnet and Ethereum Sepolia balances
 */

const { ethers } = require('ethers');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { ECPairFactory } = require('ecpair');

// Initialize ECC library
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

// Get configuration from environment
const BITCOIN_NETWORK = process.env.BITCOIN_NETWORK || 'testnet';
const BITCOIN_PRIVATE_KEY = process.env.BITCOIN_PRIVATE_KEY;
const ETHEREUM_NETWORK = process.env.ETHEREUM_NETWORK || 'sepolia';
const ETHEREUM_PRIVATE_KEY = process.env.ETHEREUM_PRIVATE_KEY;
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://rpc.sepolia.org';

/**
 * Get Bitcoin address from private key
 */
function getBitcoinAddress(privateKeyWIF, network = 'testnet') {
  try {
    const keyPair = ECPair.fromWIF(privateKeyWIF, bitcoin.networks[network]);
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: keyPair.publicKey, 
      network: bitcoin.networks[network] 
    });
    return address;
  } catch (error) {
    console.error('Error deriving Bitcoin address:', error.message);
    return null;
  }
}

/**
 * Get Bitcoin balance from block explorer
 */
async function getBitcoinBalance(address, network = 'testnet') {
  try {
    const baseUrl = network === 'testnet' 
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';
    
    const response = await fetch(`${baseUrl}/address/${address}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const balanceSatoshis = data.chain_stats?.funded_txo_sum || 0;
    const spentSatoshis = data.chain_stats?.spent_txo_sum || 0;
    const balance = (balanceSatoshis - spentSatoshis) / 100000000; // Convert to BTC
    
    return {
      balance,
      balanceSatoshis: balanceSatoshis - spentSatoshis,
      address,
      network
    };
  } catch (error) {
    console.error('Error fetching Bitcoin balance:', error.message);
    return null;
  }
}

/**
 * Get Ethereum address from private key
 */
function getEthereumAddress(privateKeyHex) {
  try {
    // Remove 0x prefix if present
    const key = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
    const wallet = new ethers.Wallet(key);
    return wallet.address;
  } catch (error) {
    console.error('Error deriving Ethereum address:', error.message);
    return null;
  }
}

/**
 * Get Ethereum balance (using Etherscan API for Sepolia)
 */
async function getEthereumBalance(address, network = 'sepolia') {
  try {
    // Try Etherscan API first (faster, no RPC needed)
    if (network === 'sepolia') {
      try {
        const response = await fetch(`https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`);
        const data = await response.json();
        if (data.status === '1' && data.result) {
          const balanceWei = BigInt(data.result);
          const balanceEth = ethers.formatEther(balanceWei.toString());
          return {
            balance: parseFloat(balanceEth),
            balanceWei: balanceWei.toString(),
            address,
            network
          };
        }
      } catch (e) {
        // Fall through to RPC method
      }
    }
    
    // Fallback to RPC
    const rpcUrl = ETHEREUM_RPC_URL || 'https://rpc.sepolia.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);
    
    return {
      balance: parseFloat(balanceEth),
      balanceWei: balance.toString(),
      address,
      network
    };
  } catch (error) {
    console.error('Error fetching Ethereum balance:', error.message);
    return null;
  }
}

/**
 * Main function
 */
async function checkBalances() {
  console.log('💰 Checking Testnet Balances\n');
  console.log('='.repeat(70));
  
  let hasAnyBalance = false;
  
  // Check Bitcoin
  if (BITCOIN_PRIVATE_KEY) {
    console.log('\n📊 Bitcoin Testnet:');
    console.log('─'.repeat(70));
    
    const btcAddress = getBitcoinAddress(BITCOIN_PRIVATE_KEY, BITCOIN_NETWORK);
    if (btcAddress) {
      console.log(`   Address: ${btcAddress}`);
      console.log(`   Network: ${BITCOIN_NETWORK}`);
      
      const btcBalance = await getBitcoinBalance(btcAddress, BITCOIN_NETWORK);
      if (btcBalance) {
        console.log(`   Balance: ${btcBalance.balance.toFixed(8)} BTC`);
        console.log(`   Balance: ${btcBalance.balanceSatoshis} satoshis`);
        console.log(`   Explorer: https://blockstream.info/${BITCOIN_NETWORK === 'testnet' ? 'testnet/' : ''}address/${btcAddress}`);
        
        if (btcBalance.balance > 0) {
          hasAnyBalance = true;
        }
      } else {
        console.log('   ❌ Could not fetch balance');
      }
    } else {
      console.log('   ❌ Could not derive address from private key');
    }
  } else {
    console.log('\n📊 Bitcoin Testnet:');
    console.log('─'.repeat(70));
    console.log('   ⚠️  BITCOIN_PRIVATE_KEY not set in environment');
  }
  
  // Check Ethereum
  if (ETHEREUM_PRIVATE_KEY) {
    console.log('\n📊 Ethereum Sepolia:');
    console.log('─'.repeat(70));
    
    const ethAddress = getEthereumAddress(ETHEREUM_PRIVATE_KEY);
    if (ethAddress) {
      console.log(`   Address: ${ethAddress}`);
      console.log(`   Network: ${ETHEREUM_NETWORK}`);
      console.log(`   RPC: ${ETHEREUM_RPC_URL.replace(/\/v3\/[^/]+/, '/v3/***')}`);
      
      const ethBalance = await getEthereumBalance(ethAddress, ETHEREUM_NETWORK);
      if (ethBalance) {
        console.log(`   Balance: ${ethBalance.balance.toFixed(6)} ETH`);
        console.log(`   Balance: ${ethBalance.balanceWei} wei`);
        console.log(`   Explorer: https://sepolia.etherscan.io/address/${ethAddress}`);
        
        if (ethBalance.balance > 0) {
          hasAnyBalance = true;
        }
      } else {
        console.log('   ❌ Could not fetch balance');
      }
    } else {
      console.log('   ❌ Could not derive address from private key');
    }
  } else {
    console.log('\n📊 Ethereum Sepolia:');
    console.log('─'.repeat(70));
    console.log('   ⚠️  ETHEREUM_PRIVATE_KEY not set in environment');
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (!hasAnyBalance && (BITCOIN_PRIVATE_KEY || ETHEREUM_PRIVATE_KEY)) {
    console.log('\n⚠️  No balances found. Get testnet coins from:');
    if (BITCOIN_PRIVATE_KEY) {
      console.log('   Bitcoin Testnet: https://testnet-faucet.mempool.co/');
    }
    if (ETHEREUM_PRIVATE_KEY) {
      console.log('   Ethereum Sepolia: https://sepoliafaucet.com/');
    }
  }
  
  console.log('');
}

// Run if called directly
if (require.main === module) {
  checkBalances().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { checkBalances, getBitcoinAddress, getEthereumAddress };

