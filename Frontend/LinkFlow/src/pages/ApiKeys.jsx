import { useEffect, useState } from "react";

import {
  getApiKeys,
  createApiKey,
  revokeApiKey,
} from "../api/apiKey.api";

const AVAILABLE_PERMISSIONS = [
  {
    value: "links:read",
    label: "Read Links",
    description: "View workspace links through the API.",
  },
  {
    value: "links:create",
    label: "Create Links",
    description: "Create new short links through the API.",
  },
  {
    value: "links:delete",
    label: "Delete Links",
    description: "Delete links through the API.",
  },
];

function formatDate(date) {
  if (!date) return "Never";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getKeyStatus(key) {
  if (key.revokedAt) return "Revoked";

  if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
    return "Expired";
  }

  return "Active";
}

export default function ApiKeys({ workspaceId }) {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState(["links:read"]);
  const [expiresAt, setExpiresAt] = useState("");

  const [generatedKey, setGeneratedKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadApiKeys() {
    if (!workspaceId) return;

    try {
      setLoading(true);
      setError("");

      const response = await getApiKeys(workspaceId);

      setApiKeys(
        Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.apiKeys)
            ? response.apiKeys
            : []
      );
    } catch (err) {
      setError(err.message || "Unable to load API keys.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApiKeys();
  }, [workspaceId]);

  function togglePermission(permission) {
    setPermissions((previous) =>
      previous.includes(permission)
        ? previous.filter((item) => item !== permission)
        : [...previous, permission]
    );
  }

  async function handleCreate(e) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter an API key name.");
      return;
    }

    if (permissions.length === 0) {
      setError("Select at least one permission.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");
      setGeneratedKey("");

      const payload = {
        name: name.trim(),
        permissions,
        ...(expiresAt
          ? { expiresAt: new Date(expiresAt).toISOString() }
          : {}),
      };

      const response = await createApiKey(workspaceId, payload);

const createdKey = response?.data?.apiKey;

      setGeneratedKey(createdKey || "");

      setSuccess(
        response?.message || "API key created successfully."
      );

      setName("");
      setPermissions(["links:read"]);
      setExpiresAt("");
      setShowForm(false);

      await loadApiKeys();
    } catch (err) {
      setError(err.message || "Unable to create API key.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId) {
    const confirmed = window.confirm(
      "Are you sure you want to revoke this API key? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await revokeApiKey(workspaceId, keyId);

      setSuccess(response?.message || "API key revoked successfully.");

      await loadApiKeys();
    } catch (err) {
      setError(err.message || "Unable to revoke API key.");
    }
  }

  async function handleCopy(value) {
    try {
      await navigator.clipboard.writeText(value);
      setSuccess("Copied to clipboard.");
    } catch {
      setError("Unable to copy. Please copy the key manually.");
    }
  }

  if (!workspaceId) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Select a workspace
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Select a workspace to manage its API keys.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            API Keys
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage API keys for external integrations with LinkFlow.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "+ Create API Key"}
        </button>
      </div>

      {/* Messages */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Generated key */}

      {generatedKey && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <h3 className="font-semibold text-amber-900">
            Your API key has been created
          </h3>

          <p className="mt-1 text-sm text-amber-800">
            Copy this key now. For security reasons, it cannot be
            viewed again.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={generatedKey}
              className="min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
            />

            <button
              onClick={() => handleCopy(generatedKey)}
              className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
            >
              Copy Key
            </button>
          </div>

          <button
            onClick={() => setGeneratedKey("")}
            className="mt-3 text-sm font-medium text-amber-900 underline"
          >
            I've saved my key
          </button>
        </div>
      )}

      {/* Create form */}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Create New API Key
          </h2>

          {/* Name */}

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              API Key Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Website Integration"
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Permissions */}

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-800">
              Permissions
            </h3>

            <div className="mt-3 space-y-3">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <label
                  key={permission.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={permissions.includes(permission.value)}
                    onChange={() =>
                      togglePermission(permission.value)
                    }
                    className="mt-1 h-4 w-4 accent-indigo-600"
                  />

                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {permission.label}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {permission.description}
                    </p>

                    <p className="mt-1 text-xs text-indigo-600">
                      {permission.value}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Expiration */}

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Expiration Date (Optional)
            </label>

            <input
              type="datetime-local"
              value={expiresAt}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-indigo-500 sm:w-auto"
            />

            <p className="mt-1 text-xs text-gray-500">
              Leave empty if the key should not expire.
            </p>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Creating..." : "Generate API Key"}
          </button>
        </form>
      )}

      {/* API keys list */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900">
            Your API Keys
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            View and manage your existing API keys.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading API keys...
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-medium text-gray-800">
              No API keys yet
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Create an API key to connect external applications
              with LinkFlow.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Key</th>
                  <th className="px-5 py-4">Permissions</th>
                  <th className="px-5 py-4">Last Used</th>
                  <th className="px-5 py-4">Expires</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {apiKeys.map((key) => {
                  const status = getKeyStatus(key);

                  return (
                    <tr key={key.id} className="hover:bg-gray-50">

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {key.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Created {formatDate(key.createdAt)}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-mono text-sm text-gray-600">
                        {key.keyPrefix}••••••
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(key.permissions || []).map((permission) => (
                            <span
                              key={permission}
                              className="rounded-md bg-indigo-50 px-2 py-1 text-xs text-indigo-700"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(key.lastUsedAt)}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(key.expiresAt)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            status === "Active"
                              ? "bg-green-100 text-green-700"
                              : status === "Expired"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {status === "Active" && (
                          <button
                            onClick={() => handleRevoke(key.id)}
                            className="text-sm font-medium text-red-600 hover:text-red-800"
                          >
                            Revoke
                          </button>
                        )}

                        {status !== "Active" && (
                          <span className="text-xs text-gray-400">
                            Unavailable
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}