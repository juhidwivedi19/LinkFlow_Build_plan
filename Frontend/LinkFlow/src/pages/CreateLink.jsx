import { useEffect, useState } from "react";
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
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [domainError, setDomainError] = useState("");

  // UI states
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Load verified custom domains
  useEffect(() => {
    let isMounted = true;

    async function loadDomains() {
      try {
        setLoadingDomains(true);
        setDomainError("");

        const response = await getCustomDomains(workspaceId);

        const verifiedDomains = (response.domains || []).filter(
          (domain) => domain.verified === true
        );

        if (isMounted) {
          setDomains(verifiedDomains);
        }
      } catch (error) {
        if (isMounted) {
          setDomainError(
            error.message || "Failed to load custom domains."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingDomains(false);
        }
      }
    }

    if (workspaceId) {
      loadDomains();
    }

    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  // Selected domain preview
  const selectedDomain = domains.find(
    (domain) => String(domain.id) === customDomainId
  );

  const previewUrl = slug.trim()
    ? selectedDomain
      ? `https://${selectedDomain.domain}/${slug.trim()}`
      : `${(
          import.meta.env.VITE_SHORT_URL_BASE ||
          import.meta.env.VITE_API_BASE_URL ||
          "http://localhost:4000"
        ).replace(/\/+$/, "")}/${slug.trim()}`
    : "Your generated slug will appear here";

  // Create link
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setCreating(true);
      setError("");

      const payload = {
        url: url.trim(),
        title: title.trim(),
        customDomainId: customDomainId
          ? Number(customDomainId)
          : null,
      };

      if (slug.trim()) {
        payload.slug = slug.trim();
      }

      if (description.trim()) {
        payload.description = description.trim();
      }

      if (expiresAt) {
        const expirationDate = new Date(expiresAt);

        if (Number.isNaN(expirationDate.getTime())) {
          throw new Error("Please provide a valid expiration date.");
        }

        if (expirationDate <= new Date()) {
          throw new Error("Expiration date must be in the future.");
        }

        payload.expiresAt = expirationDate.toISOString();
      }

      if (password.trim()) {
        payload.password = password.trim();
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

        {/* Back button */}
        <button
          type="button"
          onClick={() =>
            navigate(`/workspaces/${workspaceId}/links`)
          }
          className="mb-6 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Links
        </button>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Link
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and customize your short link.
          </p>
        </div>

        {/* Errors */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

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
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
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
                Loading verified domains...
              </p>
            )}

            {domainError && (
              <p className="mt-2 text-xs text-red-600">
                {domainError}
              </p>
            )}

            {!loadingDomains && !domainError && domains.length === 0 && (
              <p className="mt-2 text-xs text-gray-500">
                No verified custom domains available.
                Add and verify a domain from Custom Domains.
              </p>
            )}

            {domains.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                Only verified custom domains are available here.
              </p>
            )}
          </div>

          {/* Custom slug */}
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
              Leave empty to let LinkFlow generate a slug.
            </p>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
              Short URL Preview
            </p>

            <p className="break-all text-sm font-medium text-blue-700">
              {previewUrl}
            </p>

            {!slug.trim() && (
              <p className="mt-1 text-xs text-gray-500">
                The final URL will be available after creation.
              </p>
            )}
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

          {/* Expiration */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Expiration Date
            </label>

            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Password protection */}
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

          {/* Submit */}
          <div className="flex justify-end border-t border-gray-100 pt-5">
            <button
              type="submit"
              disabled={creating || loadingDomains}
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