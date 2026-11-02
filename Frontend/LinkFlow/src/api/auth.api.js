
import { apiRequest } from "./client";

// Register a new user
export async function registerUser(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Log in an existing user
export async function loginUser(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Retrieve the currently authenticated user
export async function getCurrentUser() {
  return apiRequest("/api/auth/me");
}

// Refresh the access token
export async function refreshToken() {
  return apiRequest("/api/auth/refresh-token", {
    method: "POST",
  });
}

// Verify the user's email address
export async function verifyEmail(verificationToken) {
  return apiRequest("/api/auth/emailverification", {
    method: "POST",
    body: JSON.stringify({ verificationToken }),
  });
}

export async function logoutUser() {
  return apiRequest("/api/auth/Logout", {
    method: "POST",
  });
}


export function resendVerificationEmail(email) {
  return apiRequest("/api/auth/emailverification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// Reset the user's password
export async function resetPassword(payload) {
  return apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


// Send a password reset email
export async function forgotPassword(email) {
  return apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}