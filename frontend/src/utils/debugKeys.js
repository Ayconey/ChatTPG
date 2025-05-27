// frontend/src/utils/debugKeys.js

export function debugStoredKeys() {
  console.log('=== 🔍 DEBUG: Stored Keys Analysis ===');
  
  // Check localStorage
  const userKeys = JSON.parse(localStorage.getItem('userKeys') || '{}');
  const publicKeysCache = JSON.parse(localStorage.getItem('publicKeysCache') || '{}');
  
  console.log('📦 User Keys in localStorage:', userKeys);
  console.log('📦 Public Keys Cache:', publicKeysCache);
  
  // Analyze each user's keys
  Object.entries(userKeys).forEach(([username, data]) => {
    console.log(`\n👤 User: ${username}`);
    console.log('  - Has encrypted private key:', !!data.encryptedPrivateKey);
    console.log('  - Public key length:', data.publicKey?.length || 0);
    console.log('  - Public key preview:', data.publicKey?.substring(0, 100) + '...');
    
    // Check if it's a valid RSA public key (should start with MII for RSA-2048)
    if (data.publicKey) {
      const isValidRSA = data.publicKey.startsWith('MII') && data.publicKey.length > 300;
      console.log('  - Looks like valid RSA key:', isValidRSA);
    }
  });
  
  // Analyze cached public keys
  Object.entries(publicKeysCache).forEach(([username, data]) => {
    console.log(`\n🔑 Cached public key for: ${username}`);
    console.log('  - Public key length:', data.publicKey?.length || 0);
    console.log('  - Public key preview:', data.publicKey?.substring(0, 100) + '...');
    console.log('  - Cached at:', new Date(data.timestamp).toLocaleString());
  });
  
  console.log('\n=== End Debug ===');
}

// Function to clear invalid keys
export function clearInvalidKeys() {
  const userKeys = JSON.parse(localStorage.getItem('userKeys') || '{}');
  const publicKeysCache = JSON.parse(localStorage.getItem('publicKeysCache') || '{}');
  
  // Clear short/invalid keys from userKeys
  Object.entries(userKeys).forEach(([username, data]) => {
    if (!data.publicKey || data.publicKey.length < 300) {
      console.log(`🗑️ Removing invalid key for user: ${username}`);
      delete userKeys[username];
    }
  });
  
  // Clear short/invalid keys from cache
  Object.entries(publicKeysCache).forEach(([username, data]) => {
    if (!data.publicKey || data.publicKey.length < 300) {
      console.log(`🗑️ Removing invalid cached key for user: ${username}`);
      delete publicKeysCache[username];
    }
  });
  
  localStorage.setItem('userKeys', JSON.stringify(userKeys));
  localStorage.setItem('publicKeysCache', JSON.stringify(publicKeysCache));
  
  console.log('✅ Invalid keys cleared');
}