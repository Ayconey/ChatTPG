// src/api/auth.js
const API_ROOT = "http://localhost:8000/user";

async function callApi(path, options = {}) {
  const res = await fetch(`${API_ROOT}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include", // include cookies!
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
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
