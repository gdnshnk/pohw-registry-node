/**
 * Generate Ethereum Sepolia Wallet
 * Creates a new Sepolia testnet wallet with private key and address
 */

const { ethers } = require('ethers');

// Generate random wallet
const wallet = ethers.Wallet.createRandom();

console.log('\n' + '='.repeat(60));
console.log('✅ Ethereum Sepolia Wallet Generated');
console.log('='.repeat(60));
console.log('\n📝 Private Key (hex):');
console.log('   ' + wallet.privateKey);
console.log('\n📍 Address:');
console.log('   ' + wallet.address);
console.log('\n⚠️  IMPORTANT: Save these securely!');
console.log('   - The private key is your wallet secret');
console.log('   - Never share it or commit it to git');
console.log('   - You will need it for the ETHEREUM_PRIVATE_KEY environment variable');
console.log('\n🔗 Next Steps:');
console.log('   1. Get Sepolia ETH from: https://sepoliafaucet.com/');
console.log('   2. Send to address: ' + wallet.address);
console.log('   3. Set environment variables:');
console.log('      export ETHEREUM_ENABLED=true');
console.log('      export ETHEREUM_NETWORK=sepolia');
console.log('      export ETHEREUM_PRIVATE_KEY=' + wallet.privateKey);
console.log('      export ANCHORING_ENABLED=true');
console.log('\n📊 Wallet Info:');
console.log('   Network: Sepolia Testnet');
console.log('   Format: Hex private key (0x...)');
console.log('   Explorer: https://sepolia.etherscan.io/address/' + wallet.address);
console.log('\n' + '='.repeat(60) + '\n');

