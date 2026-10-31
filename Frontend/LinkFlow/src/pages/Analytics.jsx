import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Globe2,
  Laptop,
  Loader2,
  MousePointerClick,
  RefreshCw,
} from "lucide-react";

import ClickAnalyticsChart from "../components/ClickAnalyticsChart";
import { getLinkAnalytics } from "../api/analytics.api";

function getAnalyticsData(response) {
  // Your backend responds with { message, status, data: analytics }.
  return response?.data ?? response;
}

function getCount(row, field) {
  const value =
    row?._count?.[field] ??
    row?._count ??
    row?.count ??
    row?.clicks ??
    0;

  return Number(value) || 0;
}

function getLabel(row, field) {
  return String(
    row?.[field] ??
      row?.name ??
      row?.value ??
      "Unknown"
  );
}

function BreakdownCard({ title, rows = [], field }) {
  const items = Array.isArray(rows) ? rows : [];
  const max = Math.max(1, ...items.map((row) => getCount(row, field)));

  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/70 p-5">
      <h2 className="text-sm font-semibold text-white">{title}</h2>

      {items.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">
          No data available yet.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {items.slice(0, 6).map((row, index) => {
            const label = getLabel(row, field);
            const count = getCount(row, field);

            return (
              <div key={`${label}-${index}`}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-slate-300" title={label}>
                    {label}
                  </span>

                  <span className="shrink-0 tabular-nums text-slate-400">
                    {count.toLocaleString()}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{
                      width: `${Math.max(2, (count / max) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MetricCard({ title, value, description, icon: Icon }) {
  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{title}</p>
        <Icon size={18} className="text-indigo-300" />
      </div>

      <p className="mt-3 text-3xl font-bold text-white">{value}</p>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </section>
  );
}

export default function Analytics({ links = [] }) {
  const [selectedLinkId, setSelectedLinkId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (links.length === 0) {
      setSelectedLinkId("");
      setAnalytics(null);
      setError("");
      return;
    }

    setSelectedLinkId((current) => {
      const stillExists = links.some(
        (link) => String(link.id) === String(current)
      );

      return stillExists ? current : String(links[0].id);
    });
  }, [links]);

  const loadAnalytics = useCallback(async () => {
    if (!selectedLinkId) {
      setAnalytics(null);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getLinkAnalytics(selectedLinkId, {
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        page: 1,
        limit: 10,
      });

      setAnalytics(getAnalyticsData(response));
    } catch (err) {
      setAnalytics(null);
      setError(err?.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [selectedLinkId, from, to]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      if (!selectedLinkId) {
        setAnalytics(null);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await getLinkAnalytics(selectedLinkId, {
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          page: 1,
          limit: 10,
        });

        if (!cancelled) {
          setAnalytics(getAnalyticsData(response));
        }
      } catch (err) {
        if (!cancelled) {
          setAnalytics(null);
          setError(err?.message || "Unable to load analytics.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, [selectedLinkId, from, to, retryCount]);

  const selectedLink = useMemo(
    () =>
      links.find(
        (link) => String(link.id) === String(selectedLinkId)
      ),
    [links, selectedLinkId]
  );

  const breakdown = analytics?.breakdown ?? {};
  const totalClicks = Number(analytics?.totalClicks ?? 0);
  const overTime = Array.isArray(analytics?.overTime)
    ? analytics.overTime
    : [];

  if (links.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-white/10 bg-slate-900/50 px-6 text-center">
        <BarChart3 size={32} className="text-indigo-300" />

        <h1 className="mt-4 text-2xl font-bold text-white">
          Analytics
        </h1>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          Create your first short link to start tracking its performance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Analytics
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Understand how people interact with your short links.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[560px]">
          <label className="text-xs text-slate-400">
            Short link

            <select
              value={selectedLinkId}
              onChange={(event) =>
                setSelectedLinkId(event.target.value)
              }
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            >
              {links.map((link) => (
                <option key={link.id} value={String(link.id)}>
                  {link.title || link.slug || link.shortUrl}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-400">
              From

              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => setFrom(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
            </label>

            <label className="text-xs text-slate-400">
              To

              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => setTo(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
            </label>
          </div>
        </div>
      </div>

      {selectedLink && (
        <div className="rounded-lg border border-white/10 bg-slate-900/50 px-4 py-3">
          <p className="truncate text-sm font-medium text-white">
            {selectedLink.title || selectedLink.slug || "Selected link"}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {selectedLink.shortUrl || selectedLink.originalUrl}
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="font-medium">Analytics couldn't be loaded</p>
            <p className="mt-1 text-rose-200/80">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="text-xs underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !analytics ? (
        <div className="flex items-center justify-center rounded-xl border border-white/10 bg-slate-900/50 py-16 text-sm text-slate-400">
          <Loader2
            size={20}
            className="mr-3 animate-spin text-indigo-400"
          />
          Loading analytics…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total clicks"
              value={loading ? "…" : totalClicks.toLocaleString()}
              description="For the selected link and date range"
              icon={MousePointerClick}
            />

            <MetricCard
              title="Countries"
              value={(breakdown.country ?? []).length.toLocaleString()}
              description="Countries in the returned results"
              icon={Globe2}
            />

            <MetricCard
              title="Browsers"
              value={(breakdown.browser ?? []).length.toLocaleString()}
              description="Browser categories in the results"
              icon={Laptop}
            />

            <MetricCard
              title="Devices"
              value={(breakdown.device ?? []).length.toLocaleString()}
              description="Device categories in the results"
              icon={Activity}
            />
          </div>

          <section className="rounded-xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-300" />
                <h2 className="text-sm font-semibold text-white">
                  Clicks over time
                </h2>
              </div>

              {loading && (
                <Loader2
                  size={16}
                  className="animate-spin text-indigo-300"
                />
              )}
            </div>

            <ClickAnalyticsChart linkId={selectedLinkId} />
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <BreakdownCard
              title="Countries"
              rows={breakdown.country}
              field="country"
            />

            <BreakdownCard
              title="Cities"
              rows={breakdown.city}
              field="city"
            />

            <BreakdownCard
              title="Browsers"
              rows={breakdown.browser}
              field="browser"
            />

            <BreakdownCard
              title="Devices"
              rows={breakdown.device}
              field="device"
            />

            <BreakdownCard
              title="Operating systems"
              rows={breakdown.os}
              field="os"
            />

            <BreakdownCard
              title="Referrers"
              rows={breakdown.referrer}
              field="referrer"
            />
          </div>

          {!loading && totalClicks === 0 && !error && (
            <p className="text-center text-xs text-slate-500">
              No click events were found for this link and date range yet.
            </p>
          )}

          {!loading && overTime.length === 0 && !error && (
            <p className="text-center text-xs text-slate-500">
              There is no click-trend data for this selection yet.
            </p>
          )}
        </>
      )}
    </div>
  );
}