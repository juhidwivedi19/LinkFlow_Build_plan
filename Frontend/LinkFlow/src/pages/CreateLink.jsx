import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createLink } from "../api/link.api";
import { getCustomDomains } from "../api/domain.api";

export default function CreateLink() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  // Link form states
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [password, setPassword] = useState("");

  // Custom domain states
  const [domains, setDomains] = useState([]);
  const [customDomainId, setCustomDomainId] = useState("");
  const [loadingDomains, setLoadingDomains] = useState(false);

  // UI states
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Fetch verified custom domains
  useEffect(() => {
    async function loadDomains() {
      try {
        setLoadingDomains(true);

        const response = await getCustomDomains(workspaceId);

        const verifiedDomains = (response.domains || []).filter(
          (domain) => domain.verified === true
        );

        setDomains(verifiedDomains);
      } catch (error) {
        console.error("Failed to load custom domains:", error);
      } finally {
        setLoadingDomains(false);
      }
    }

    if (workspaceId) {
      loadDomains();
    }
  }, [workspaceId]);

  // Handle link creation
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setCreating(true);
      setError("");

      const payload = {
        url,
        title,
        customDomainId: customDomainId
          ? Number(customDomainId)
          : null,
      };

      // Optional custom slug
      if (slug.trim()) {
        payload.slug = slug.trim();
      }

      // Optional description
      if (description.trim()) {
        payload.description = description.trim();
      }

      // Optional expiration date
      if (expiresAt) {
        payload.expiresAt = new Date(expiresAt).toISOString();
      }

      // Optional password protection
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">

        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate(`/workspaces/${workspaceId}/links`)}
          className="mb-6 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Links
        </button>

        {/* Page Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Link
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and customize your short link.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Create Link Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >

          {/* Destination URL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Destination URL *
            </label>

            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Custom Domain */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Custom Domain
            </label>

            <select
              value={customDomainId}
              onChange={(e) => setCustomDomainId(e.target.value)}
              disabled={loadingDomains}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">
                Use default LinkFlow domain
              </option>

              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.domain}
                </option>
              ))}
            </select>

            {loadingDomains && (
              <p className="mt-2 text-xs text-gray-500">
                Loading custom domains...
              </p>
            )}

            {!loadingDomains && domains.length === 0 && (
              <p className="mt-2 text-xs text-gray-500">
                No verified custom domains available.
                You can add and verify a domain from Custom Domains.
              </p>
            )}

            {domains.length > 0 && !loadingDomains && (
              <p className="mt-2 text-xs text-gray-500">
                Select a verified domain to use it for your short link.
              </p>
            )}
          </div>

          {/* Custom Slug */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Custom Slug
            </label>

            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-custom-link"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-xs text-gray-500">
              Leave empty if you want the backend to generate a slug.
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Title *
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Link"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows="4"
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Expiration Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Expiration Date
            </label>

            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Password Protection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password Protection
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Optional password"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-xs text-gray-500">
              Visitors will need this password to access the destination.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end border-t border-gray-100 pt-5">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create Link"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}