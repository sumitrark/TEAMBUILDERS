"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Bell,
  Check,
  CheckCheck,
  Mail,
  Trophy,
  Users,
  X,
} from "lucide-react";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  Notification,
} from "@/services/notification";


function getNotificationIcon(
  type: string
) {
  switch (type) {
    case "team_invitation":
      return <Mail size={18} />;

    case "team_invitation_accepted":
      return <Check size={18} />;

    case "team_invitation_declined":
      return <X size={18} />;

    case "hackathon":
      return <Trophy size={18} />;

    case "team":
      return <Users size={18} />;

    default:
      return <Bell size={18} />;
  }
}


function formatTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const difference =
    now.getTime() - date.getTime();

  const minutes = Math.floor(
    difference / (1000 * 60)
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    }
  );
}


export default function NotificationBell() {
  const router = useRouter();

  const [open, setOpen] =
    useState(false);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement>(null);


  async function loadNotifications() {
    try {
      setLoading(true);

      const [
        notificationData,
        count,
      ] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);

      setNotifications(
        notificationData
      );

      setUnreadCount(count);

    } catch (error: any) {
      /*
       * A 401 simply means the user is not
       * authenticated. Don't show an error
       * popup from the notification bell.
       */

      if (
        error?.response?.status !== 401
      ) {
        console.error(
          "Failed to load notifications:",
          error
        );
      }

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadNotifications();

    /*
     * Refresh notification count every
     * 30 seconds while dashboard is open.
     */

    const interval =
      setInterval(
        loadNotifications,
        30000
      );

    return () =>
      clearInterval(interval);
  }, []);


  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);


  async function handleNotificationClick(
    notification: Notification
  ) {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(
          notification.id
        );

        setNotifications(
          (previous) =>
            previous.map((item) =>
              item.id === notification.id
                ? {
                    ...item,
                    is_read: true,
                  }
                : item
            )
        );

        setUnreadCount(
          (previous) =>
            Math.max(previous - 1, 0)
        );
      }

      setOpen(false);

      if (notification.action_url) {
        router.push(
          notification.action_url
        );
      }

    } catch (error) {
      console.error(
        "Failed to open notification:",
        error
      );
    }
  }


  async function handleMarkAllRead() {
    try {
      await markAllNotificationsAsRead();

      setNotifications(
        (previous) =>
          previous.map((item) => ({
            ...item,
            is_read: true,
          }))
      );

      setUnreadCount(0);

    } catch (error) {
      console.error(
        "Failed to mark notifications as read:",
        error
      );
    }
  }


  return (
    <div
      ref={containerRef}
      className="relative"
    >

      {/* Bell */}

      <button
        type="button"
        onClick={() => {
          setOpen(
            (previous) => !previous
          );

          if (!open) {
            loadNotifications();
          }
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Notifications"
      >

        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}

      </button>


      {/* Dropdown */}

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

          {/* Header */}

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

            <div>
              <h3 className="font-bold text-slate-900">
                Notifications
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={
                  handleMarkAllRead
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800"
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            )}

          </div>


          {/* Content */}

          <div className="max-h-[430px] overflow-y-auto">

            {loading &&
            notifications.length === 0 ? (

              <div className="p-8 text-center">

                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading notifications...
                </p>

              </div>

            ) : notifications.length ===
              0 ? (

              <div className="p-10 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Bell size={25} />
                </div>

                <h4 className="mt-4 font-semibold text-slate-800">
                  No notifications
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  You're all caught up!
                </p>

              </div>

            ) : (

              notifications.map(
                (notification) => (

                  <button
                    key={
                      notification.id
                    }
                    type="button"
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                    className={`flex w-full gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${
                      !notification.is_read
                        ? "bg-violet-50/60"
                        : "bg-white"
                    }`}
                  >

                    {/* Icon */}

                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        !notification.is_read
                          ? "bg-violet-100 text-violet-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {getNotificationIcon(
                        notification.type
                      )}
                    </div>


                    {/* Text */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-2">

                        <p
                          className={`text-sm ${
                            !notification.is_read
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {
                            notification.title
                          }
                        </p>

                        {!notification.is_read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
                        )}

                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {
                          notification.message
                        }
                      </p>

                      <p className="mt-2 text-[11px] text-slate-400">
                        {formatTime(
                          notification.created_at
                        )}
                      </p>

                    </div>

                  </button>

                )
              )

            )}

          </div>


          {/* Footer */}

          <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(
                  "/dashboard/invitations"
                );
              }}
              className="w-full text-center text-sm font-semibold text-violet-600 hover:text-violet-800"
            >
              View invitations →
            </button>

          </div>

        </div>
      )}

    </div>
  );
}