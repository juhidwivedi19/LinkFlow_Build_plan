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

export async function getWorkspaceMembers(workspaceId) {
  return apiRequest(`/api/workspaces/${workspaceId}/members`);
}

export async function addWorkspaceMember(workspaceId, payload) {
  return apiRequest(`/api/workspaces/${workspaceId}/members`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMemberRole(workspaceId, userId, payload) {
  return apiRequest(
    `/api/workspaces/${workspaceId}/members/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function removeWorkspaceMember(workspaceId, userId) {
  return apiRequest(
    `/api/workspaces/${workspaceId}/members/${userId}`,
    {
      method: "DELETE",
    }
  );
}

export async function leaveWorkspace(workspaceId) {
  return apiRequest(`/api/workspaces/${workspaceId}/leave`, {
    method: "POST",
  });
}