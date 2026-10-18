import { apiRequest } from "./client";

function getWorkspacePath(workspaceId) {
  const id = Number(workspaceId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("A valid workspace ID is required");
  }

  return `/api/workspaces/${id}/links`;
}

export async function getWorkspaceLinks(workspaceId, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const path = getWorkspacePath(workspaceId);
  const suffix = query.toString();

  return apiRequest(suffix ? `${path}?${suffix}` : path);
}

export async function createLink(workspaceId, payload) {
  return apiRequest(getWorkspacePath(workspaceId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLink(workspaceId, linkId) {
  return apiRequest(`${getWorkspacePath(workspaceId)}/${Number(linkId)}`);
}

export async function updateLink(workspaceId, linkId, payload) {
  return apiRequest(`${getWorkspacePath(workspaceId)}/${Number(linkId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteLink(workspaceId, linkId) {
  return apiRequest(`${getWorkspacePath(workspaceId)}/${Number(linkId)}`, {
    method: "DELETE",
  });
}