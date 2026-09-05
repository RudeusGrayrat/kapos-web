"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getErpNotifications,
  markAllErpNotificationsAsRead,
  markErpNotificationAsRead,
} from "../lib/erp-api";
import type { ErpNotificationSummary } from "../types/erp";
import { useAuth } from "./auth-context";
import { useToast } from "./toast-context";

type NotificationsContextValue = {
  notifications: ErpNotificationSummary[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);
const POLLING_INTERVAL_MS = 20_000;

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, activeOrganizationId, isAuthenticated } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState<ErpNotificationSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());
  const hasHydratedRef = useRef(false);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !activeOrganizationId) {
      setNotifications([]);
      setUnreadCount(0);
      knownNotificationIdsRef.current = new Set();
      hasHydratedRef.current = false;
      return;
    }

    setIsLoading(true);
    try {
      const response = await getErpNotifications({
        accessToken,
        organizationId: activeOrganizationId,
        page: 1,
        limit: 10,
      });
      const previousIds = knownNotificationIdsRef.current;
      const incomingIds = new Set(response.data.map((notification) => notification.id));
      const newestUnread = response.data.find(
        (notification) => !notification.readAt && !previousIds.has(notification.id),
      );

      setNotifications(response.data);
      setUnreadCount(response.unread);
      knownNotificationIdsRef.current = incomingIds;

      if (hasHydratedRef.current && newestUnread) {
        const show =
          newestUnread.severity === "CRITICAL"
            ? toast.showError
            : newestUnread.severity === "WARNING"
              ? toast.showWarning
              : newestUnread.severity === "SUCCESS"
                ? toast.showSuccess
                : toast.showInfo;
        show(newestUnread.message, newestUnread.title);
      }
      hasHydratedRef.current = true;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeOrganizationId, isAuthenticated, toast]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!accessToken || !activeOrganizationId) return;
      await markErpNotificationAsRead({
        accessToken,
        organizationId: activeOrganizationId,
        notificationId,
      });
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, readAt: new Date().toISOString() }
            : notification,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    },
    [accessToken, activeOrganizationId],
  );

  const markAllAsRead = useCallback(async () => {
    if (!accessToken || !activeOrganizationId) return;
    await markAllErpNotificationsAsRead({
      accessToken,
      organizationId: activeOrganizationId,
    });
    const now = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, readAt: notification.readAt ?? now })),
    );
    setUnreadCount(0);
  }, [accessToken, activeOrganizationId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshNotifications();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshNotifications]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !activeOrganizationId) return;
    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, POLLING_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [accessToken, activeOrganizationId, isAuthenticated, refreshNotifications]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [isLoading, markAllAsRead, markAsRead, notifications, refreshNotifications, unreadCount],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications debe usarse dentro de NotificationsProvider.");
  }
  return context;
}
