/**
 * Generate Bitcoin Testnet Wallet
 * Creates a new testnet wallet with WIF private key and address
 */

const bitcoin = require('bitcoinjs-lib');
const crypto = require('crypto');

// For bitcoinjs-lib v7, we need to use ECPair differently
// Try to use the same method as the anchoring code
let ECPair;
try {
  // Try the newer way (bitcoinjs-lib v7)
  const ecc = require('tiny-secp256k1');
  const ecpair = require('ecpair');
  bitcoin.initEccLib(ecc);
  ECPair = ecpair.ECPairFactory(ecc);
} catch (e) {
  // Fallback: try direct access (older versions)
  ECPair = bitcoin.ECPair;
}

if (!ECPair) {
  console.error('❌ Could not initialize ECPair. Please install: npm install ecpair tiny-secp256k1');
  process.exit(1);
}

const network = bitcoin.networks.testnet;

// Generate random key pair
let keyPair;
try {
  if (ECPair.makeRandom) {
    keyPair = ECPair.makeRandom({ network });
  } else {
    // Fallback: generate random private key manually
    const privateKey = crypto.randomBytes(32);
    keyPair = ECPair.fromPrivateKey(privateKey, { network });
  }
} catch (error) {
  console.error('❌ Error generating key pair:', error.message);
  console.error('Trying alternative method...');
  
  // Alternative: generate using crypto and create key pair
  const privateKey = crypto.randomBytes(32);
  keyPair = ECPair.fromPrivateKey(privateKey, { network });
}

// Get WIF (Wallet Import Format)
const wif = keyPair.toWIF();

// Generate both address types
const p2pkhAddress = bitcoin.payments.p2pkh({ 
  pubkey: keyPair.publicKey, 
  network 
}).address;

const p2wpkhAddress = bitcoin.payments.p2wpkh({ 
  pubkey: keyPair.publicKey, 
  network 
}).address;

console.log('\n' + '='.repeat(60));
console.log('✅ Bitcoin Testnet Wallet Generated');
console.log('='.repeat(60));
console.log('\n📝 WIF Private Key:');
console.log('   ' + wif);
console.log('\n📍 Addresses (both work with same key):');
console.log('   P2PKH (Legacy): ' + p2pkhAddress);
console.log('   Bech32 (tb1...): ' + p2wpkhAddress);
console.log('\n⚠️  IMPORTANT: Save these securely!');
console.log('   - The WIF key is your private key');
console.log('   - Never share it or commit it to git');
console.log('   - You will need it for the BITCOIN_PRIVATE_KEY environment variable');
console.log('\n🔗 Next Steps:');
console.log('   - Use Bech32 address for: https://bitcoinfaucet.uo1.net/');
console.log('   - Use P2PKH address for: https://testnet-faucet.mempool.co/');
console.log('   - Both addresses work with the same WIF key!');
console.log('\n' + '='.repeat(60) + '\n');

