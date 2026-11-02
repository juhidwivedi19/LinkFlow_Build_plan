import { apiRequest } from "./client";

export async function getCustomDomains(workspaceId) {
    return apiRequest(`/workspaces/${workspaceId}/domains`, {
        method: "GET",
    });
}

export async function createCustomDomain(workspaceId, domain) {
    return apiRequest(`/workspaces/${workspaceId}/domains`, {
        method: "POST",
        body: JSON.stringify({ domain }),
    });
}

export async function verifyCustomDomain(workspaceId, domainId) {
    return apiRequest(
        `/workspaces/${workspaceId}/domains/${domainId}/verify`,
        {
            method: "POST",
        }
    );
}

export async function deleteCustomDomain(workspaceId, domainId) {
    return apiRequest(
        `/workspaces/${workspaceId}/domains/${domainId}`,
        {
            method: "DELETE",
        }
    );
}