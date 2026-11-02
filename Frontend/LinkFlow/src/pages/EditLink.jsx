
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getLink,
  updateLink,
} from "../api/link.api";

export default function EditLink() {
  const { workspaceId, linkId } = useParams();
  const navigate = useNavigate();

  const [link, setLink] = useState(null);

  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchLink() {
      try {
        setLoading(true);
        setError("");

        const data = await getLink(workspaceId, linkId);

        const fetchedLink = data.link;

        setLink(fetchedLink);
        setUrl(fetchedLink.url || "");
        setSlug(fetchedLink.slug || "");
        setTitle(fetchedLink.title || "");
        setDescription(fetchedLink.description || "");
        setStatus(fetchedLink.status || "ACTIVE");

        if (fetchedLink.expiresAt) {
          const date = new Date(fetchedLink.expiresAt);

          const formattedDate = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(0, 16);

          setExpiresAt(formattedDate);
        }
      } catch (error) {
        setError(error.message || "Failed to load link");
      } finally {
        setLoading(false);
      }
    }

    fetchLink();
  }, [workspaceId, linkId]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        url: url.trim(),
        slug: slug.trim(),
        title: title.trim(),
        description: description.trim() || null,
        status,
      };

      if (expiresAt) {
        payload.expiresAt = new Date(expiresAt).toISOString();
      } else {
        payload.expiresAt = null;
      }

      if (password.trim()) {
        payload.password = password;
      }

      const data = await updateLink(
        workspaceId,
        linkId,
        payload
      );

      setLink(data.link);
      setPassword("");

      setSuccess("Link updated successfully");
    } catch (error) {
      setError(error.message || "Failed to update link");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div>Loading link...</div>;
  }

  if (!link && error) {
    return (
      <div>
        <button
          onClick={() =>
            navigate(`/workspaces/${workspaceId}/links`)
          }
        >
          ← Back to Links
        </button>

        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          navigate(`/workspaces/${workspaceId}/links`)
        }
      >
        ← Back to Links
      </button>

      <h1>Edit Link</h1>

      {error && <p>{error}</p>}
      {success && <p>{success}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Destination URL *</label>

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Custom Slug *</label>

          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Title *</label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Description</label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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

          <p>Leave empty for no expiration date.</p>
        </div>

        <div>
          <label>New Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave empty to keep the current password"
          />
        </div>

        <div>
          <label>Status</label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

