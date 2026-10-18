import { apiRequest } from "./client";

function getAnalyticsPath(linkId) {
  const id = Number(linkId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("A valid link ID is required");
  }

  return `/api/analytics/links/${id}/analytics`;
}

export async function getLinkAnalytics(linkId, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const path = getAnalyticsPath(linkId);
  const suffix = query.toString();

  return apiRequest(suffix ? `${path}?${suffix}` : path);
}