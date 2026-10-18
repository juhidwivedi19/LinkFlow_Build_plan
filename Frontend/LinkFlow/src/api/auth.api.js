import { apiRequest } from "./client";

export async function registerUser(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser() {
  return apiRequest("/api/auth/me");
}

export async function refreshToken() {
  return apiRequest("/api/auth/refresh-token", {
    method: "POST",
  });
}

export async function logoutUser() {
  return apiRequest("/api/auth/Logout", {
    method: "POST",
  });
}