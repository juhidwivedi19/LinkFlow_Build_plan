import { apiRequest } from "./client";

export async function getWorkspaces() {
  return apiRequest("/api/workspaces");
}

export async function createWorkspace(payload) {
  return apiRequest("/api/workspaces", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getWorkspace(workspaceId) {
  return apiRequest(`/api/workspaces/${workspaceId}`);
}

export async function updateWorkspace(workspaceId, payload) {
  return apiRequest(`/api/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteWorkspace(workspaceId) {
  return apiRequest(`/api/workspaces/${workspaceId}`, {
    method: "DELETE",
  });
}