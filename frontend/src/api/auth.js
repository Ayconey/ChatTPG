// src/api/auth.js
const API_ROOT = "http://localhost:8000/user";

async function callApi(path, options = {}) {
  const res = await fetch(`${API_ROOT}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export function registerUser(username, password) {
  return callApi("/register/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function loginUser(username, password) {
  return callApi("/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  }).then((data) => {
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);
    return data;
  });
}

export async function refreshAccessToken() {
  const refresh = localStorage.getItem("refreshToken");
  if (!refresh) throw new Error("No refresh token");
  const data = await callApi("/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
  localStorage.setItem("accessToken", data.access);
  return data.access;
}
