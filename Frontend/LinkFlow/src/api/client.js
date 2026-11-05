
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
).replace(/\/+$/, "");

import { toast } from "sonner";

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => "");
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
  const error = new Error(
    data?.message || `Request failed with status ${response.status}`
  );

  error.status = response.status;
  error.retryAfter = response.headers.get("Retry-After");

  // Handle rate-limit errors globally
  if (response.status === 429) {
    const retrySeconds = Number(error.retryAfter);

    const description =
      Number.isFinite(retrySeconds) && retrySeconds > 0
        ? `Please try again in ${retrySeconds} seconds.`
        : "Please try again later.";

    toast.error("Too many requests!", {
      id: "rate-limit-error",
      description,
      duration: 5000,
    });
  }

  throw error;
}

  return data;
}

