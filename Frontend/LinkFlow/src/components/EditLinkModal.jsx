import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

export default function EditLinkModal({
  link,
  existingLinks = [],
  onClose,
  onSave,
}) {
  const [url, setUrl] = useState(link.originalUrl || "");
  const [title, setTitle] = useState(link.title || "");
  const [slug, setSlug] = useState(link.slug || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUrl(link.originalUrl || "");
    setTitle(link.title || "");
    setSlug(link.slug || "");
  }, [link]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanUrl = url.trim();
    const cleanTitle = title.trim();
    const cleanSlug = slug.trim();

    try {
      const parsedUrl = new URL(cleanUrl);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are supported.");
      }
    } catch {
      setError("Enter a valid destination URL.");
      return;
    }

    if (!cleanTitle) {
      setError("Link title is required.");
      return;
    }

    if (!/^[A-Za-z0-9_-]{3,30}$/.test(cleanSlug)) {
      setError(
        "The slug must contain 3–30 letters, numbers, hyphens, or underscores."
      );
      return;
    }

    const slugExists = existingLinks.some(
      (item) =>
        String(item.id) !== String(link.id) &&
        item.slug?.toLowerCase() === cleanSlug.toLowerCase()
    );

    if (slugExists) {
      setError("That slug is already used by another link.");
      return;
    }

    setSaving(true);

    try {
      await onSave(link, {
        url: new URL(cleanUrl).href,
        title: cleanTitle,
        slug: cleanSlug,
      });

      onClose();
    } catch (err) {
      setError(err.message || "Unable to update the link.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Edit short link</h2>
            <p className="mt-2 text-sm text-slate-400">
              Update the destination and details of your link.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit dialog"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="edit-link-url"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Destination URL
            </label>

            <input
              id="edit-link-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="edit-link-title"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Link title
            </label>

            <input
              id="edit-link-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="edit-link-slug"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Custom slug
            </label>

            <div className="flex overflow-hidden rounded-lg border border-white/10 bg-slate-950 focus-within:border-indigo-500">
              <span className="flex items-center border-r border-white/10 px-3 text-sm text-slate-500">
                /
              </span>

              <input
                id="edit-link-slug"
                type="text"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                maxLength={30}
                required
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}