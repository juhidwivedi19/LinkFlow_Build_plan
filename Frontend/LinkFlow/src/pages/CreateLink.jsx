import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createLink } from "../api/link.api";

export default function CreateLink() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [password, setPassword] = useState("");

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setCreating(true);
      setError("");

      const payload = {
        url,
        title,
      };

      // Only send optional fields when they have values
      if (slug.trim()) {
        payload.slug = slug.trim();
      }

      if (description.trim()) {
        payload.description = description.trim();
      }

      if (expiresAt) {
        payload.expiresAt = new Date(expiresAt).toISOString();
      }

      if (password.trim()) {
        payload.password = password;
      }

      await createLink(workspaceId, payload);

      navigate(`/workspaces/${workspaceId}/links`);
    } catch (error) {
      setError(error.message || "Failed to create link");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(`/workspaces/${workspaceId}/links`)}
      >
        ← Back to Links
      </button>

      <h1>Create New Link</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Destination URL *</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />
        </div>

        <div>
          <label>Custom Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-custom-link"
          />
          <p>Leave empty if you want the backend to generate a slug.</p>
        </div>

        <div>
          <label>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Link"
            required
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows="4"
          />
        </div>

        <div>
          <label>Expiration Date</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        <div>
          <label>Password Protection</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Optional password"
          />
        </div>

        <button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create Link"}
        </button>
      </form>
    </div>
  );
}