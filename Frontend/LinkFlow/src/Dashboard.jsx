import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  Globe,
  Link2,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import NotificationBell from "./components/NotificationBell";
import ClickAnalyticsChart from "./components/ClickAnalyticsChart";
import { useAuth } from "./context/AuthContext";
import { getWorkspaces, createWorkspace } from "./api/workspace.api";
import {
  getWorkspaceLinks,
  createLink as createLinkApi,
  deleteLink as deleteLinkApi,
} from "./api/link.api";
import "./App.css";

const SHORT_BASE_URL = (
  import.meta.env.VITE_SHORT_BASE_URL ||
  "http://localhost:4000/api/redirect"
).replace(/\/+$/, "");

const NAVIGATION = [
  {
    label: "Overview",
    icon: BarChart3,
    section: "main",
  },
  {
    label: "Links",
    icon: Link2,
    section: "main",
  },
  {
    label: "Analytics",
    icon: Activity,
    section: "main",
  },
  {
    label: "QR Codes",
    icon: QrCode,
    section: "main",
  },
  {
    label: "Team members",
    icon: Users,
    section: "workspace",
  },
  {
    label: "Custom domains",
    icon: Globe,
    section: "workspace",
  },
  {
    label: "API & Integrations",
    icon: ShieldCheck,
    section: "workspace",
  },
  {
    label: "Settings",
    icon: Settings,
    section: "other",
  },
  {
    label: "Help & support",
    icon: CircleHelp,
    section: "other",
  },
];

function extractWorkspaces(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.workspaces)) return response.workspaces;
  if (Array.isArray(response?.data?.workspaces)) {
    return response.data.workspaces;
  }
  if (response?.workspace) return [response.workspace];
  if (response?.data?.workspace) return [response.data.workspace];

  return [];
}

function extractLinks(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.links)) return response.links;
  if (Array.isArray(response?.data?.links)) return response.data.links;

  return [];
}

function normalizeLink(link) {
  const slug = String(link.slug || "");

  return {
    ...link,
    id: link.id,
    title: link.title || link.url || "Untitled link",
    originalUrl: link.url || link.originalUrl || "",
    slug,
    shortUrl:
      link.shortUrl ||
      (slug ? `${SHORT_BASE_URL}/${encodeURIComponent(slug)}` : ""),
    clicks: Number(link.clicks) || 0,
    createdAt: link.createdAt
      ? new Date(link.createdAt).toLocaleDateString()
      : "",
  };
}

function getInitials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function isValidUrl(value) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`fixed bottom-5 right-5 z-[100] flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl ${
        isError
          ? "border-red-500/30 bg-slate-900 text-red-300"
          : "border-emerald-500/30 bg-slate-900 text-emerald-300"
      }`}
    >
      {isError ? <AlertCircle size={18} /> : <Check size={18} />}

      <p className="flex-1 text-sm">{toast.message}</p>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="text-slate-400 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function Sidebar({
  activePage,
  setActivePage,
  workspaceName,
  user,
  onLogout,
  loggingOut,
  mobileOpen,
  onCloseMobile,
}) {
  const name = user?.name || user?.email?.split("@")[0] || "User";

  function renderNavigation(section) {
    return NAVIGATION.filter((item) => item.section === section).map(
      (item) => {
        const Icon = item.icon;
        const active = activePage === item.label;

        return (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              setActivePage(item.label);
              onCloseMobile();
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
              active
                ? "bg-indigo-500/15 font-medium text-indigo-300"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{item.label}</span>
          </button>
        );
      }
    );
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-slate-950 transition-transform lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white">
            <Link2 size={20} />
          </div>

          <span className="text-xl font-bold tracking-tight text-white">
            LinkFlow
          </span>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="ml-auto text-slate-400 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-white/10 p-4">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.06]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-sm font-semibold text-indigo-300">
              {getInitials(workspaceName)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {workspaceName}
              </p>
              <p className="text-xs text-slate-500">Workspace</p>
            </div>

            <ChevronDown size={16} className="text-slate-500" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Menu
            </p>
            <div className="space-y-1">{renderNavigation("main")}</div>
          </div>

          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Workspace
            </p>
            <div className="space-y-1">
              {renderNavigation("workspace")}
            </div>
          </div>

          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Other
            </p>
            <div className="space-y-1">{renderNavigation("other")}</div>
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
              {getInitials(name)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {name}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user?.email || "LinkFlow account"}
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              title="Log out"
              aria-label="Log out"
              className="text-slate-500 transition hover:text-red-300 disabled:opacity-50"
            >
              {loggingOut ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogOut size={18} />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({
  activePage,
  user,
  onOpenMobile,
  onSearch,
  onLogout,
  loggingOut,
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const name = user?.name || user?.email?.split("@")[0] || "User";

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 sm:px-6 lg:px-8">
  <div className="flex min-w-0 items-center gap-3">
    <button
      type="button"
      onClick={onOpenMobile}
      aria-label="Open navigation"
      className="text-slate-400 hover:text-white lg:hidden"
    >
      <Menu size={21} />
    </button>

    <div className="truncate text-sm">
      <span className="text-slate-500">Workspace</span>
      <span className="mx-2 text-slate-700">/</span>
      <span className="font-medium text-white">{activePage}</span>
    </div>
  </div>

  <div className="flex items-center gap-2 sm:gap-4">
    <button
      type="button"
      onClick={onSearch}
      className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-400 transition hover:bg-white/[0.06] sm:flex"
    >
      <Search size={16} />
      <span>Search links</span>
      <span className="ml-4 rounded border border-white/10 px-1.5 py-0.5 text-[10px]">
        Ctrl K
      </span>
    </button>

    {/* Working notification component */}
    <NotificationBell />

    {/* Account menu */}
    <div className="relative">
      <button
        type="button"
        aria-label="Account menu"
        onClick={() => setAccountOpen((previous) => !previous)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300"
      >
        {getInitials(name)}
      </button>

      {accountOpen && (
        <div className="absolute right-0 top-12 z-30 w-56 rounded-xl border border-white/10 bg-slate-900 p-3 shadow-2xl">
          <p className="truncate px-2 py-1 text-sm font-medium text-white">
            {name}
          </p>

          <p className="truncate px-2 pb-3 text-xs text-slate-500">
            {user?.email}
          </p>

          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-red-300"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      )}
    </div>
  </div>
</header>
);
}

function MetricCard({ label, value, description, icon: Icon, trend }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/70 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-300">
          <Icon size={20} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs">
        {trend ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <ArrowUpRight size={14} />
            {trend}
          </span>
        ) : null}

        <span className="text-slate-500">{description}</span>
      </div>
    </div>
  );
}

function EmptyLinks({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
        <Link2 size={27} />
      </div>

      <h3 className="mt-5 text-base font-semibold text-white">
        No links yet
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
        Create your first short link to start organizing and tracking your
        URLs.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
      >
        <Plus size={17} />
        Create your first link
      </button>
    </div>
  );
}

function LinkRow({ link, onDelete, onCopy }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);

    try {
      await onDelete(link);
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  }

  return (
    <div className="group grid grid-cols-1 gap-4 border-b border-white/[0.06] px-4 py-4 transition hover:bg-white/[0.02] sm:px-5 md:grid-cols-[minmax(0,1fr)_100px_110px_40px] md:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
            <Link2 size={16} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {link.title}
            </p>

            {link.shortUrl ? (
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate text-xs text-indigo-400 transition hover:text-indigo-300"
              >
                {link.shortUrl}
              </a>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Slug unavailable
              </p>
            )}
          </div>
        </div>

        <p
          className="mt-2 truncate pl-10 text-xs text-slate-500"
          title={link.originalUrl}
        >
          {link.originalUrl}
        </p>
      </div>

      <div className="flex items-center justify-between text-sm md:block">
        <span className="text-xs text-slate-500 md:hidden">Clicks</span>
        <span className="font-medium text-white">
          {formatNumber(link.clicks)}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 md:block">
        <span className="md:hidden">Created</span>
        <span>{link.createdAt || "—"}</span>
      </div>

      <div className="relative flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onCopy(link.shortUrl)}
          disabled={!link.shortUrl}
          title="Copy short link"
          aria-label="Copy short link"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Copy size={16} />
        </button>

        <button
          type="button"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label="Link options"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <MoreHorizontal size={17} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 z-20 w-36 rounded-lg border border-white/10 bg-slate-900 p-1 shadow-xl">
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Delete link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateLinkModal({ onClose, onCreate, existingLinks }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();
    const trimmedSlug = slug.trim();

    if (!isValidUrl(trimmedUrl)) {
      setError("Enter a valid URL starting with http:// or https://.");
      return;
    }

    if (!trimmedTitle) {
      setError("Please enter a title for your link.");
      return;
    }

    if (
      trimmedSlug &&
      !/^[A-Za-z0-9_-]{3,30}$/.test(trimmedSlug)
    ) {
      setError(
        "Custom slugs must contain 3–30 letters, numbers, hyphens, or underscores."
      );
      return;
    }

    if (
      trimmedSlug &&
      existingLinks.some(
        (link) => link.slug?.toLowerCase() === trimmedSlug.toLowerCase()
      )
    ) {
      setError("That slug is already being used by one of your links.");
      return;
    }

    try {
      setSubmitting(true);

      await onCreate({
        url: new URL(trimmedUrl).href,
        title: trimmedTitle,
        ...(trimmedSlug ? { slug: trimmedSlug } : {}),
      });

      onClose();
    } catch (err) {
      setError(err.message || "Unable to create your link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Create a short link</h2>
            <p className="mt-2 text-sm text-slate-400">
              Add a destination and choose how your link appears.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="link-url"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Destination URL
            </label>

            <input
              id="link-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/your-page"
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="link-title"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Link title
            </label>

            <input
              id="link-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="My campaign link"
              maxLength={120}
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="link-slug"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Custom slug <span className="font-normal text-slate-500">(optional)</span>
            </label>

            <div className="flex overflow-hidden rounded-lg border border-white/10 bg-slate-950 focus-within:border-indigo-500">
              <span className="flex items-center border-r border-white/10 px-3 text-xs text-slate-500">
                / 
              </span>

              <input
                id="link-slug"
                type="text"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="my-campaign"
                maxLength={30}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Leave blank to let the backend generate a slug.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? "Creating..." : "Create link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ComingSoonPage({ title, description, icon: Icon }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
        <Icon size={30} />
      </div>

      <h2 className="mt-6 text-2xl font-bold text-white">{title}</h2>

      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
        {description}
      </p>

      <span className="mt-5 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
        Coming soon
      </span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activePage, setActivePage] = useState("Overview");
  const [workspaceId, setWorkspaceId] = useState(null);
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const workspaceResponse = await getWorkspaces();
      let workspaces = extractWorkspaces(workspaceResponse);

      if (!workspaces.length) {
        const createResponse = await createWorkspace({
          name: "My Workspace",
        });

        const createdWorkspace =
          createResponse?.workspace ||
          createResponse?.data?.workspace ||
          createResponse?.data ||
          createResponse;

        if (!createdWorkspace?.id) {
          throw new Error(
            "Workspace creation did not return a workspace ID. Check your workspace API response."
          );
        }

        workspaces = [createdWorkspace];
      }

      const workspace = workspaces[0];

      if (!workspace?.id) {
        throw new Error("Your workspace response is missing its ID.");
      }

      setWorkspaceId(workspace.id);
      setWorkspaceName(workspace.name || "My Workspace");

      const linksResponse = await getWorkspaceLinks(workspace.id, {
        page: 1,
        limit: 100,
      });

      setLinks(extractLinks(linksResponse).map(normalizeLink));
    } catch (err) {
      setLoadError(err.message || "Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    function handleNavigateLinks() {
      setActivePage("Links");
    }

    function handleKeyboard(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setCreateModalOpen(false);
        setMobileOpen(false);
      }
    }

    window.addEventListener("linkflow:navigate-links", handleNavigateLinks);
    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener(
        "linkflow:navigate-links",
        handleNavigateLinks
      );
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  const filteredLinks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return links;

    return links.filter((link) =>
      [
        link.title,
        link.originalUrl,
        link.shortUrl,
        link.slug,
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [links, searchQuery]);

  const totalClicks = links.reduce(
    (total, link) => total + (Number(link.clicks) || 0),
    0
  );

  async function handleCreateLink(payload) {
    if (!workspaceId) {
      throw new Error("No workspace is available. Reload the dashboard and try again.");
    }

    const response = await createLinkApi(workspaceId, payload);
    const createdLink = response?.link || response?.data?.link || response?.data || response;

    if (!createdLink?.id) {
      throw new Error(
        "The server did not return the created link. Check your create-link API response."
      );
    }

    const normalized = normalizeLink(createdLink);

    setLinks((previous) => [
      normalized,
      ...previous.filter((link) => link.id !== normalized.id),
    ]);

    notify("Short link created successfully.");
  }

  async function handleDeleteLink(link) {
    try {
      await deleteLinkApi(workspaceId, link.id);

      setLinks((previous) =>
        previous.filter((item) => item.id !== link.id)
      );

      notify("Link deleted successfully.");
    } catch (err) {
      notify(err.message || "Unable to delete this link.", "error");
      throw err;
    }
  }

  async function handleCopy(shortUrl) {
    if (!shortUrl) {
      notify("This link does not have a short URL yet.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(shortUrl);
      notify("Short link copied to clipboard.");
    } catch {
      notify("Unable to copy the link. Check browser clipboard permissions.", "error");
    }
  }

  async function handleLogout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      notify(err.message || "Unable to log out.", "error");
    } finally {
      setLoggingOut(false);
    }
  }

  const pageDescriptions = {
    Analytics: {
      icon: Activity,
      description:
        "Explore click trends, referrers, locations, devices, and browser analytics.",
    },
    "QR Codes": {
      icon: QrCode,
      description: "Generate and manage QR codes for your short links.",
    },
    "Team members": {
      icon: Users,
      description: "Collaborate with teammates in your workspace.",
    },
    "Custom domains": {
      icon: Globe,
      description: "Connect your own domain to create branded short links.",
    },
    "API & Integrations": {
      icon: ShieldCheck,
      description: "Manage API keys and integrate LinkFlow with your applications.",
    },
    Settings: {
      icon: Settings,
      description: "Manage your account and workspace preferences.",
    },
    "Help & support": {
      icon: CircleHelp,
      description: "Find answers and get help using LinkFlow.",
    },
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        workspaceName={workspaceName}
        user={user}
        onLogout={handleLogout}
        loggingOut={loggingOut}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          activePage={activePage}
          user={user}
          onOpenMobile={() => setMobileOpen(true)}
          onSearch={() => setSearchOpen(true)}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {loadError && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-red-300"
                />
                <div>
                  <p className="text-sm font-medium text-red-300">
                    Could not load your dashboard
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {loadError}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadDashboard}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/5"
              >
                Retry
              </button>
            </div>
          )}

          {activePage === "Overview" && (
            <>
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Overview
                  </h1>
                  <p className="mt-2 text-sm text-slate-400">
                    Track your links and monitor their performance.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-indigo-400"
                >
                  <Plus size={17} />
                  Create link
                </button>
              </div>

              {loading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2
                    size={28}
                    className="animate-spin text-indigo-400"
                  />
                  <span className="ml-3 text-sm text-slate-400">
                    Loading your dashboard...
                  </span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      label="Total clicks"
                      value={formatNumber(totalClicks)}
                      description="Reported by the links API"
                      icon={Activity}
                    />
                    <MetricCard
                      label="Total links"
                      value={formatNumber(links.length)}
                      description="Links in this workspace"
                      icon={Link2}
                    />
                    <MetricCard
                      label="Average CTR"
                      value="—"
                      description="Analytics integration pending"
                      icon={BarChart3}
                    />
                    <MetricCard
                      label="Active links"
                      value={formatNumber(
                        links.filter((link) => !link.expiresAt || new Date(link.expiresAt) > new Date()).length
                      )}
                      description="Links not expired"
                      icon={Zap}
                    />
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
                    <section className="min-w-0 rounded-xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-base font-semibold text-white">
                            Click analytics
                          </h2>
                          <p className="mt-1 text-xs text-slate-500">
                            Click trends over time
                          </p>
                        </div>

                        <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400">
                          Last 7 days
                        </span>
                      </div>

                      <div className="mt-6 min-h-56">
                        <ClickAnalyticsChart />
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        Historical chart data is not yet connected to the analytics API.
                      </p>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-semibold text-white">
                            Recent activity
                          </h2>
                          <p className="mt-1 text-xs text-slate-500">
                            Your latest links
                          </p>
                        </div>
                        <Activity size={18} className="text-slate-500" />
                      </div>

                      {links.length === 0 ? (
                        <p className="py-10 text-center text-sm text-slate-500">
                          No activity yet. Create your first link.
                        </p>
                      ) : (
                        <div className="mt-5 space-y-5">
                          {links.slice(0, 5).map((link) => (
                            <div key={link.id} className="flex gap-3">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
                                <Link2 size={15} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-slate-200">
                                  Created {link.title}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {link.createdAt || "Date unavailable"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>

                  <section className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-slate-900/70">
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                      <div>
                        <h2 className="text-base font-semibold text-white">
                          Recent links
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                          Your recently created short links
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActivePage("Links")}
                        className="flex items-center gap-1 text-sm text-indigo-400 transition hover:text-indigo-300"
                      >
                        View all
                        <ArrowRight size={15} />
                      </button>
                    </div>

                    {links.length === 0 ? (
                      <EmptyLinks
                        onCreate={() => setCreateModalOpen(true)}
                      />
                    ) : (
                      links.slice(0, 5).map((link) => (
                        <LinkRow
                          key={link.id}
                          link={link}
                          onDelete={handleDeleteLink}
                          onCopy={handleCopy}
                        />
                      ))
                    )}
                  </section>
                </>
              )}
            </>
          )}

          {activePage === "Links" && (
            <>
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Links
                  </h1>
                  <p className="mt-2 text-sm text-slate-400">
                    Manage all your short links in one place.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-indigo-400"
                >
                  <Plus size={17} />
                  Create link
                </button>
              </div>

              <section className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/70">
                <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      All links
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatNumber(links.length)} links in this workspace
                    </p>
                  </div>

                  <div className="relative w-full sm:max-w-xs">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search links..."
                      className="w-full rounded-lg border border-white/10 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2
                      size={24}
                      className="animate-spin text-indigo-400"
                    />
                    <span className="ml-3 text-sm text-slate-400">
                      Loading links...
                    </span>
                  </div>
                ) : filteredLinks.length === 0 ? (
                  searchQuery ? (
                    <div className="px-6 py-14 text-center">
                      <Search
                        size={26}
                        className="mx-auto text-slate-600"
                      />
                      <p className="mt-4 text-sm font-medium text-white">
                        No matching links
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Try another search term.
                      </p>
                    </div>
                  ) : (
                    <EmptyLinks
                      onCreate={() => setCreateModalOpen(true)}
                    />
                  )
                ) : (
                  filteredLinks.map((link) => (
                    <LinkRow
                      key={link.id}
                      link={link}
                      onDelete={handleDeleteLink}
                      onCopy={handleCopy}
                    />
                  ))
                )}
              </section>
            </>
          )}

          {pageDescriptions[activePage] && (
            <ComingSoonPage
              title={activePage}
              description={pageDescriptions[activePage].description}
              icon={pageDescriptions[activePage].icon}
            />
          )}
        </main>

        <footer className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-600 sm:px-6 lg:px-8">
          LinkFlow · Link analytics platform
        </footer>
      </div>

      {createModalOpen && (
        <CreateLinkModal
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreateLink}
          existingLinks={links}
        />
      )}

      {searchOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/70 px-4 pt-[15vh] backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSearchOpen(false);
            }
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search size={18} className="text-slate-500" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setActivePage("Links");
                }}
                placeholder="Search your links..."
                className="min-w-0 flex-1 bg-transparent py-4 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="rounded border border-white/10 px-2 py-1 text-xs text-slate-400 hover:text-white"
              >
                ESC
              </button>
            </div>

            <div className="p-3">
              {filteredLinks.slice(0, 6).map((link) => (
                <button
                  type="button"
                  key={link.id}
                  onClick={() => {
                    setActivePage("Links");
                    setSearchOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-white/5"
                >
                  <Link2 size={17} className="shrink-0 text-indigo-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{link.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {link.shortUrl || link.originalUrl}
                    </p>
                  </div>
                </button>
              ))}

              {filteredLinks.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-slate-500">
                  No links found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}