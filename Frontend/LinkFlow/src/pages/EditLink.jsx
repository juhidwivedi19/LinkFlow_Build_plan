import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getLink,
  updateLink,
} from "../api/link.api";

import { getCustomDomains } from "../api/domain.api";

const SHORT_URL_BASE = (
  import.meta.env.VITE_SHORT_URL_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/+$/, "");

export default function EditLink() {
  const { workspaceId, linkId } = useParams();
  const navigate = useNavigate();

  const [link, setLink] = useState(null);

  // Link fields
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  // Custom domain fields
  const [domains, setDomains] = useState([]);
  const [customDomainId, setCustomDomainId] = useState("");
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [domainError, setDomainError] = useState("");

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load link and custom domains
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError("");
        setDomainError("");

        const [linkData, domainData] = await Promise.all([
          getLink(workspaceId, linkId),
          getCustomDomains(workspaceId),
        ]);

        if (!isMounted) return;

        const fetchedLink = linkData.link;

        setLink(fetchedLink);

        setUrl(fetchedLink.url || "");
        setSlug(fetchedLink.slug || "");
        setTitle(fetchedLink.title || "");
        setDescription(fetchedLink.description || "");
        setStatus(fetchedLink.status || "ACTIVE");

        // Preserve the existing custom domain.
        setCustomDomainId(
          fetchedLink.customDomainId
            ? String(fetchedLink.customDomainId)
            : ""
        );

        // Only verified domains can be selected.
        const verifiedDomains = (domainData.domains || []).filter(
          (domain) => domain.verified === true
        );

        setDomains(verifiedDomains);

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
        if (isMounted) {
          setError(error.message || "Failed to load link");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingDomains(false);
        }
      }
    }

    if (workspaceId && linkId) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [workspaceId, linkId]);

  // Selected domain
  const selectedDomain = domains.find(
    (domain) => String(domain.id) === customDomainId
  );

  // URL preview
  const previewUrl = slug.trim()
    ? selectedDomain
      ? `https://${selectedDomain.domain}/${slug.trim()}`
      : `${SHORT_URL_BASE}/${slug.trim()}`
    : "Enter a slug to preview your short URL";

  // Update link
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

        // Send null when switching back to default domain.
        customDomainId: customDomainId
          ? Number(customDomainId)
          : null,
      };

      // Expiration
      if (expiresAt) {
        const expirationDate = new Date(expiresAt);

        if (Number.isNaN(expirationDate.getTime())) {
          throw new Error("Please enter a valid expiration date.");
        }

        if (expirationDate <= new Date()) {
          throw new Error("Expiration date must be in the future.");
        }

        payload.expiresAt = expirationDate.toISOString();
      } else {
        payload.expiresAt = null;
      }

      // Only send password when user enters a new one.
      if (password.trim()) {
        payload.password = password.trim();
      }

      const data = await updateLink(
        workspaceId,
        linkId,
        payload
      );

      setLink(data.link || {
        ...link,
        ...payload,
      });

      setPassword("");
      setSuccess("Link updated successfully.");
    } catch (error) {
      setError(error.message || "Failed to update link");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Loading link details...
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button
          onClick={() =>
            navigate(`/workspaces/${workspaceId}/links`)
          }
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Links
        </button>

        <p className="mt-5 text-red-600">
          {error || "Link not found."}
        </p>
      </div>
    );
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
            Edit Link
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update your short link settings and configuration.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
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
                Loading custom domains...
              </p>
            )}

            {domainError && (
              <p className="mt-2 text-xs text-red-600">
                {domainError}
              </p>
            )}

            {!loadingDomains && domains.length === 0 && (
              <p className="mt-2 text-xs text-gray-500">
                No verified custom domains available.
              </p>
            )}

            <p className="mt-2 text-xs text-gray-500">
              Changing the domain changes the hostname used for this short link.
            </p>
          </div>

          {/* Short URL Preview */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
              Short URL Preview
            </p>

            <p className="break-all text-sm font-medium text-blue-700">
              {previewUrl}
            </p>
          </div>

          {/* Slug */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Custom Slug *
            </label>

            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-xs text-gray-500">
              Leave empty for no expiration date.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              New Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty to keep the current password"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-xs text-gray-500">
              Leave empty to retain the existing password.
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Link Status
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex justify-end border-t border-gray-100 pt-5">
            <button
              type="submit"
              disabled={saving || loadingDomains}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}