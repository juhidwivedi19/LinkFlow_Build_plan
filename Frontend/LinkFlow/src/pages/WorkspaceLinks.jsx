import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getWorkspaceLinks,
  deleteLink,
} from "../api/link.api";

import { getWorkspace } from "../api/workspace.api";

export default function WorkspaceLinks() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [links, setLinks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deletingLinkId, setDeletingLinkId] = useState(null);

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

        // Supports the links array returned by the backend
        setLinks(linksData.links || []);
      } catch (error) {
        setError(error.message || "Failed to load links");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [workspaceId]);

  async function handleDeleteLink(linkId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this link? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingLinkId(linkId);
      setError("");
      setSuccess("");

      await deleteLink(workspaceId, linkId);

      setLinks((currentLinks) =>
        currentLinks.filter((link) => link.id !== linkId)
      );

      setSuccess("Link deleted successfully");
    } catch (error) {
      setError(error.message || "Failed to delete link");
    } finally {
      setDeletingLinkId(null);
    }
  }

  function handleCreateLink() {
    navigate(`/workspaces/${workspaceId}/links/create`);
  }

  function handleEditLink(linkId) {
    navigate(`/workspaces/${workspaceId}/links/${linkId}`);
  }

  if (loading) {
    return <div>Loading links...</div>;
  }

  return (
    <div>
      <button onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button>

      <h1>
        {workspace ? `${workspace.name} Links` : "Workspace Links"}
      </h1>

      {workspace && (
        <p>
          Workspace: <strong>{workspace.name}</strong>
        </p>
      )}

      {error && <p>{error}</p>}
      {success && <p>{success}</p>}

      <div>
        <button onClick={handleCreateLink}>
          + Create New Link
        </button>

        <button
          onClick={() =>
            navigate(`/workspaces/${workspaceId}/settings`)
          }
        >
          Workspace Settings
        </button>
      </div>

      <hr />

      {links.length === 0 ? (
        <div>
          <h2>No links found</h2>
          <p>Create your first short link to get started.</p>

          <button onClick={handleCreateLink}>
            Create Your First Link
          </button>
        </div>
      ) : (
        <div>
          <h2>All Links</h2>

          {links.map((link) => (
            <div
              key={link.id}
              style={{
                border: "1px solid #ccc",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              <div>
                <h3>{link.title || "Untitled Link"}</h3>

                {link.description && (
                  <p>{link.description}</p>
                )}
              </div>

              <div>
                <p>
                  <strong>Short slug:</strong> {link.slug}
                </p>

                <p>
                  <strong>Destination:</strong> {link.url}
                </p>

                <p>
                  <strong>Status:</strong> {link.status}
                </p>

                {link.expiresAt && (
                  <p>
                    <strong>Expires:</strong>{" "}
                    {new Date(link.expiresAt).toLocaleString()}
                  </p>
                )}

                {link.createdAt && (
                  <p>
                    <strong>Created:</strong>{" "}
                    {new Date(link.createdAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <button
                  onClick={() => handleEditLink(link.id)}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDeleteLink(link.id)}
                  disabled={deletingLinkId === link.id}
                >
                  {deletingLinkId === link.id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}