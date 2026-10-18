import { apiRequest } from "./client";

export async function getNotifications(params = {}) {
  const query = new URLSearchParams(params).toString();

  return apiRequest(
    `/api/notifications${query ? `?${query}` : ""}`,
    { method: "GET" }
  );
}

export async function markNotificationAsRead(id) {
  return apiRequest(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsAsRead() {
  return apiRequest("/api/notifications/read-all", {
    method: "PATCH",
  });
}