// src/api/auth.js
const API_ROOT = "http://localhost:8000/user";

async function callApi(path, options = {}) {
  const res = await fetch(`${API_ROOT}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include", // include cookies!
    ...options,
  });

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const error = new Error(`API ${path} failed: ${res.status}`);
    error.response = {
      status: res.status,
      data: data || { detail: "Unknown error" },
    };
    throw error;
  }

  return data;
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
  return callApi("/refresh/", { 
    method: "POST",
    credentials: "include",});
}

export function getUserKeys() {
  return callApi("/key/");
}