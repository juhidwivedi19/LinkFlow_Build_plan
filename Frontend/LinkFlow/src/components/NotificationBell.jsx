import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/notification.api";

function formatNotificationDate(date) {
  if (!date) return "";

  const notificationDate = new Date(date);

  if (Number.isNaN(notificationDate.getTime())) return "";

  return notificationDate.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef(null);

  async function fetchNotifications() {
    setLoading(true);
    setError("");

    try {
      const response = await getNotifications({
        page: "1",
        limit: "10",
      });

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to load notifications."
        );
      }

      setNotifications(response.data || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (err) {
      setError(
        err?.message || "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();

    const intervalId = window.setInterval(() => {
      fetchNotifications();
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleMarkAsRead(notification) {
    if (notification.isRead) return;

    setActionLoading(true);
    setError("");

    try {
      const response = await markNotificationAsRead(
        notification.id
      );

      if (!response?.success) {
        throw new Error(
          response?.message || "Could not mark notification as read."
        );
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (err) {
      setError(
        err?.message || "Could not update notification."
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) return;

    setActionLoading(true);
    setError("");

    try {
      const response = await markAllNotificationsAsRead();

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Could not mark all notifications as read."
        );
      }

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      setError(
        err?.message || "Could not update notifications."
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={`Notifications${
          unreadCount > 0 ? `, ${unreadCount} unread` : ""
        }`}
        aria-expanded={isOpen}
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);

          if (nextOpen) {
            fetchNotifications();
          }
        }}
        className="relative rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
      >
        <Bell size={19} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Notifications
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                {unreadCount === 0
                  ? "You're all caught up"
                  : `${unreadCount} unread notification${
                      unreadCount === 1 ? "" : "s"
                    }`}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Refresh notifications"
                title="Refresh"
                disabled={loading}
                onClick={fetchNotifications}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  aria-label="Mark all notifications as read"
                  title="Mark all as read"
                  disabled={actionLoading}
                  onClick={handleMarkAllAsRead}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-indigo-300 disabled:opacity-50"
                >
                  <CheckCheck size={16} />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="border-b border-red-400/20 bg-red-400/5 px-4 py-3 text-xs text-red-300"
            >
              {error}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-400">
                <LoaderCircle size={17} className="animate-spin" />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell
                  size={25}
                  className="mx-auto text-slate-600"
                />

                <p className="mt-3 text-sm font-medium text-white">
                  No notifications yet
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Updates about your links and workspace will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b border-white/5 px-4 py-3 transition last:border-b-0 ${
                    notification.isRead
                      ? "bg-transparent"
                      : "bg-indigo-500/[0.06]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        notification.isRead
                          ? "bg-slate-600"
                          : "bg-indigo-400"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">
                        {notification.title}
                      </p>

                      <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-400">
                        {notification.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500">
                          {formatNotificationDate(
                            notification.createdAt
                          )}
                        </span>

                        {!notification.isRead && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() =>
                              handleMarkAsRead(notification)
                            }
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-indigo-300 transition hover:bg-indigo-400/10 disabled:opacity-50"
                          >
                            <Check size={12} />
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-white/10 px-4 py-2">
            <p className="text-center text-[10px] text-slate-500">
              Showing the latest 10 notifications
            </p>
          </div>
        </div>
      )}
    </div>
  );
}