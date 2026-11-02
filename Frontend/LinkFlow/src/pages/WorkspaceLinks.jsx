import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getWorkspaceLinks,
  deleteLink,
} from "../api/link.api";

import { getWorkspace } from "../api/workspace.api";

const SHORT_URL_BASE = (
  import.meta.env.VITE_SHORT_URL_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/+$/, "");

function getShortUrl(link) {
  if (link.customDomain?.domain) {
    return `https://${link.customDomain.domain}/${link.slug}`;
  }

  return `${SHORT_URL_BASE}/${link.slug}`;
}

export default function WorkspaceLinks() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [links, setLinks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deletingLinkId, setDeletingLinkId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        const [workspaceData, linksData] = await Promise.all([
          getWorkspace(workspaceId),
          getWorkspaceLinks(workspaceId),
        ]);

        setWorkspace(workspaceData.workspace);
        setLinks(linksData.links || []);
      } catch (error) {
        setError(error.message || "Failed to load links");
      } finally {
        setLoading(false);
      }
    }

    if (workspaceId) {
      fetchData();
    }
  }, [workspaceId]);

  async function handleDeleteLink(linkId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this link? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingLinkId(linkId);
      setError("");
      setSuccess("");

      await deleteLink(workspaceId, linkId);

      setLinks((currentLinks) =>
        currentLinks.filter((link) => link.id !== linkId)
      );

      setSuccess("Link deleted successfully.");
    } catch (error) {
      setError(error.message || "Failed to delete link");
    } finally {
      setDeletingLinkId(null);
    }
  }

  async function handleCopyLink(link) {
    try {
      await navigator.clipboard.writeText(getShortUrl(link));

      setCopiedLinkId(link.id);
      setSuccess("Short URL copied successfully.");

      setTimeout(() => {
        setCopiedLinkId(null);
      }, 2000);
    } catch {
      setError("Unable to copy the short URL.");
    }
  }

  function handleCreateLink() {
    navigate(`/workspaces/${workspaceId}/links/create`);
  }

  function handleEditLink(linkId) {
    navigate(`/workspaces/${workspaceId}/links/${linkId}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Loading workspace links...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-4 text-sm font-medium text-gray-600 hover:text-blue-600"
          >
            ← Back to Dashboard
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {workspace
                  ? `${workspace.name} Links`
                  : "Workspace Links"}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage and monitor your workspace short links.
              </p>
            </div>

            <button
              onClick={handleCreateLink}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Create New Link
            </button>
          </div>
        </div>

        {/* Workspace information */}
        {workspace && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Workspace</p>
            <p className="font-semibold text-gray-900">
              {workspace.name}
            </p>

            <button
              onClick={() =>
                navigate(`/workspaces/${workspaceId}/settings`)
              }
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              Workspace Settings →
            </button>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Links */}
        {links.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              No links found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Create your first short link to get started.
            </p>

            <button
              onClick={handleCreateLink}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create Your First Link
            </button>
          </div>
        ) : (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              All Links ({links.length})
            </h2>

            <div className="space-y-4">
              {links.map((link) => {
                const shortUrl = getShortUrl(link);

                return (
                  <div
                    key={link.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    {/* Title and description */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {link.title || "Untitled Link"}
                      </h3>

                      {link.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {link.description}
                        </p>
                      )}
                    </div>

                    {/* Short URL */}
                    <div className="mb-4 rounded-lg bg-blue-50 p-3">
                      <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
                        Short URL
                      </p>

                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-sm font-medium text-blue-700 hover:underline"
                        >
                          {shortUrl}
                        </a>

                        <button
                          onClick={() => handleCopyLink(link)}
                          className="rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          {copiedLinkId === link.id
                            ? "Copied!"
                            : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* Custom domain */}
                    {link.customDomain?.domain && (
                      <div className="mb-4">
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                          Custom Domain: {link.customDomain.domain}
                        </span>
                      </div>
                    )}

                    {/* Link information */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="break-all">
                        <strong className="text-gray-800">
                          Destination:
                        </strong>{" "}
                        {link.url}
                      </p>

                      <p>
                        <strong className="text-gray-800">
                          Status:
                        </strong>{" "}
                        {link.status}
                      </p>

                      {link.expiresAt && (
                        <p>
                          <strong className="text-gray-800">
                            Expires:
                          </strong>{" "}
                          {new Date(link.expiresAt).toLocaleString()}
                        </p>
                      )}

                      {link.createdAt && (
                        <p>
                          <strong className="text-gray-800">
                            Created:
                          </strong>{" "}
                          {new Date(link.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex gap-3 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => handleEditLink(link.id)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        disabled={deletingLinkId === link.id}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingLinkId === link.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}