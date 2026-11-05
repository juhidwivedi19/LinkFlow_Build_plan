import { apiRequest } from "./client";

function getApiKeyPath(workspaceId) {
  const id = Number(workspaceId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("A valid workspace ID is required");
  }

  return `/api/workspaces/${id}/api-keys`;
}

export async function getApiKeys(workspaceId) {
  return apiRequest(getApiKeyPath(workspaceId));
}

export async function createApiKey(workspaceId, payload) {
  return apiRequest(getApiKeyPath(workspaceId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function revokeApiKey(workspaceId, keyId) {
  return apiRequest(
    `${getApiKeyPath(workspaceId)}/${Number(keyId)}`,
    {
      method: "DELETE",
    }
  );
}