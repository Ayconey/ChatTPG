// frontend/src/api/auth.js
const API_ROOT = "http://localhost:8000/user";

async function callApi(path, options = {}) {
  const url = `${API_ROOT}${path}`;
  console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
  
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      credentials: "include", // include cookies!
      ...options,
    });
    
    console.log(`📊 Response: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ API Error ${res.status}:`, errorText);
      throw new Error(`API ${path} failed: ${res.status} - ${errorText}`);
    }
    
    const data = await res.json();
    console.log(`✅ API Success:`, data);
    return data;
  } catch (error) {
    console.error(`💥 API Call Failed:`, error);
    throw error;
  }
}

export function registerUser(userData) {
  return callApi("/register/", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export function loginUser(username, password) {
  return callApi("/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logoutUser() {
  return callApi("/logout/", { method: "POST" });
}

export function getCurrentUser() {
  return callApi("/me/");
}

export function refreshAccessToken() {
  return callApi("/refresh/", { method: "POST" });
}

// NOWE ENDPOINTY CRYPTO
export function getUserCryptoKeys() {
  return callApi("/crypto/keys/");
}

export function getUserPublicKey(username) {
  console.log(`🔍 Fetching public key for user: ${username}`);
  return callApi(`/crypto/public-key/${username}/`);
}