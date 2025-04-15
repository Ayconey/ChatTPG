// src/api/auth.js

export async function loginUser(username, password) {
    const response = await fetch("http://localhost:8000/user/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  
    if (!response.ok) {
      throw new Error("Login failed");
    }
  
    // Expected response: { "refresh": "...", "access": "..." }
    const data = await response.json();
  
    // Store tokens in localStorage
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);
  
    // Return tokens if you need them in the component
    return data;
  }
  
  // (Already had registerUser; keep it)
  export async function registerUser(username, password) {
    const response = await fetch("http://localhost:8000/user/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  
    if (!response.ok) {
      throw new Error("Registration failed");
    }
  
    return response.json();
  }
  
  export async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token found. User might need to log in again.");
    }
  
    const response = await fetch("http://localhost:8000/user/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
  
    if (!response.ok) {
      // Refresh token is likely expired or invalid; force logout or prompt re-login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      throw new Error("Failed to refresh token, please log in again.");
    }
  
    const data = await response.json();
    // data = { "access": "new_access_token" }
  
    // Update the accessToken in localStorage
    localStorage.setItem("accessToken", data.access);
  
    return data.access;
  }