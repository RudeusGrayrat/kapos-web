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
import type {
  ErpAccessSummary,
  AuthResponse,
  AuthUser,
  LoginInput,
  MembershipAccessSummary,
  NavigationModule,
  PlatformAccessSummary,
  UpdateCurrentUserInput,
} from "../types/auth";
import {
  getErpAccessSummary,
  updateCurrentUser,
  loginErp,
  logoutErp,
  refreshErpSession,
} from "../lib/auth-api";
import { ApiError, isApiError } from "../lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  platformContext: PlatformAccessSummary;
  memberships: MembershipAccessSummary[];
  activeOrganization: MembershipAccessSummary | null;
  activeOrganizationId: string | null;
  setActiveOrganizationId: (organizationId: string | null) => void;
  navigationCatalog: NavigationModule[];
  effectivePermissionKeys: string[];
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: (options?: { silent?: boolean }) => Promise<AuthResponse | null>;
  reloadCurrentUser: () => Promise<ErpAccessSummary>;
  updateProfile: (input: UpdateCurrentUserInput) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const ACTIVE_ORGANIZATION_STORAGE_KEY = "kapos.activeOrganizationId";

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [platformContext, setPlatformContext] = useState<PlatformAccessSummary>(
    null,
  );
  const [memberships, setMemberships] = useState<MembershipAccessSummary[]>([]);
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(
    null,
  );
  const [navigationCatalog, setNavigationCatalog] = useState<NavigationModule[]>([]);
  const [effectivePermissionKeys, setEffectivePermissionKeys] = useState<string[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<AuthResponse | null> | null>(null);

  const applySession = useCallback((session: AuthResponse) => {
    accessTokenRef.current = session.accessToken;
    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);

  const applyAccessSummary = useCallback((summary: ErpAccessSummary) => {
    setUser(summary.user);
    setPlatformContext(summary.platformContext);
    setMemberships(summary.memberships);
    setNavigationCatalog(summary.navigationCatalog);
    setEffectivePermissionKeys(summary.effectivePermissionKeys);

    setActiveOrganizationIdState((current) => {
      const storedOrganizationId =
        typeof window === "undefined"
          ? null
          : window.localStorage.getItem(ACTIVE_ORGANIZATION_STORAGE_KEY);
      const preferredOrganizationId = current ?? storedOrganizationId;
      const preferredMembership = summary.memberships.find(
        (membership) => membership.organizationId === preferredOrganizationId,
      );
      const fallbackMembership =
        summary.memberships.find(
          (membership) => membership.membershipStatus === "ACTIVE",
        ) ?? summary.memberships[0];
      const nextOrganizationId =
        preferredMembership?.organizationId ?? fallbackMembership?.organizationId ?? null;

      if (typeof window !== "undefined") {
        if (nextOrganizationId) {
          window.localStorage.setItem(
            ACTIVE_ORGANIZATION_STORAGE_KEY,
            nextOrganizationId,
          );
        } else {
          window.localStorage.removeItem(ACTIVE_ORGANIZATION_STORAGE_KEY);
        }
      }

      return nextOrganizationId;
    });
  }, []);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    setAccessToken(null);
    setUser(null);
    setPlatformContext(null);
    setMemberships([]);
    setActiveOrganizationIdState(null);
    setNavigationCatalog([]);
    setEffectivePermissionKeys([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACTIVE_ORGANIZATION_STORAGE_KEY);
    }
  }, []);

  const setActiveOrganizationId = useCallback(
    (organizationId: string | null) => {
      const nextOrganizationId =
        organizationId && memberships.some((membership) => membership.organizationId === organizationId)
          ? organizationId
          : null;

      setActiveOrganizationIdState(nextOrganizationId);

      if (typeof window !== "undefined") {
        if (nextOrganizationId) {
          window.localStorage.setItem(
            ACTIVE_ORGANIZATION_STORAGE_KEY,
            nextOrganizationId,
          );
        } else {
          window.localStorage.removeItem(ACTIVE_ORGANIZATION_STORAGE_KEY);
        }
      }
    },
    [memberships],
  );

  const refreshSession = useCallback(
    async (options?: { silent?: boolean }) => {
      if (refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }

      const refreshTask = (async () => {
        try {
          const session = await refreshErpSession();
          applySession(session);
          try {
            const accessSummary = await getErpAccessSummary(session.accessToken);
            applyAccessSummary(accessSummary);
          } catch (error) {
            if (!(isApiError(error) && error.status === 401)) {
              throw error;
            }
          }
          return session;
        } catch (error) {
          if (isApiError(error) && error.status === 401) {
            clearSession();
            return null;
          }

          clearSession();

          if (options?.silent) {
            return null;
          }

          throw error;
        } finally {
          refreshPromiseRef.current = null;
        }
      })();

      refreshPromiseRef.current = refreshTask;
      return refreshTask;
    },
    [applyAccessSummary, applySession, clearSession],
  );

  const runAuthenticatedRequest = useCallback(
    async <T,>(operation: (token: string) => Promise<T>) => {
      let token = accessTokenRef.current;

      if (!token) {
        const restoredSession = await refreshSession({ silent: true });
        token = restoredSession?.accessToken ?? null;
      }

      if (!token) {
        clearSession();
        throw new ApiError(401, ["Tu sesion ha expirado."]);
      }

      try {
        return await operation(token);
      } catch (error) {
        if (!(isApiError(error) && error.status === 401)) {
          throw error;
        }

        const refreshedSession = await refreshSession({ silent: true });

        if (!refreshedSession?.accessToken) {
          clearSession();
          throw error;
        }

        return operation(refreshedSession.accessToken);
      }
    },
    [clearSession, refreshSession],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const session = await loginErp(input);
      applySession(session);
      const accessSummary = await getErpAccessSummary(session.accessToken);
      applyAccessSummary(accessSummary);
    },
    [applyAccessSummary, applySession],
  );

  const logout = useCallback(async () => {
    try {
      await logoutErp();
    } catch (error) {
      if (!(isApiError(error) && error.status === 401)) {
        throw error;
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const reloadCurrentUser = useCallback(async () => {
    const accessSummary = await runAuthenticatedRequest((token) =>
      getErpAccessSummary(token),
    );

    applyAccessSummary(accessSummary);
    return accessSummary;
  }, [applyAccessSummary, runAuthenticatedRequest]);

  const updateProfile = useCallback(
    async (input: UpdateCurrentUserInput) => {
      const updatedUser = await runAuthenticatedRequest((token) =>
        updateCurrentUser(token, input),
      );

      setUser(updatedUser);
      return updatedUser;
    },
    [runAuthenticatedRequest],
  );

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        await refreshSession({ silent: true });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [refreshSession]);

  useEffect(() => {
    if (!accessToken) return;

    const expiresAt = getJwtExpirationMs(accessToken);
    if (!expiresAt) return;

    const refreshMarginMs = 60_000;
    const refreshDelay = Math.max(0, expiresAt - Date.now() - refreshMarginMs);
    const timeoutId = window.setTimeout(() => {
      void refreshSession({ silent: true });
    }, refreshDelay);

    return () => window.clearTimeout(timeoutId);
  }, [accessToken, refreshSession]);

  useEffect(() => {
    function refreshWhenSessionMayBeStale() {
      const token = accessTokenRef.current;
      const expiresAt = token ? getJwtExpirationMs(token) : null;
      const shouldRefresh = !expiresAt || expiresAt - Date.now() <= 60_000;

      if (shouldRefresh) {
        void refreshSession({ silent: true });
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshWhenSessionMayBeStale();
      }
    }

    window.addEventListener("focus", refreshWhenSessionMayBeStale);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshWhenSessionMayBeStale);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => {
      const activeOrganization =
        memberships.find(
          (membership) => membership.organizationId === activeOrganizationId,
        ) ?? null;

      return {
        user,
        platformContext,
        memberships,
        activeOrganization,
        activeOrganizationId,
        setActiveOrganizationId,
        navigationCatalog,
        effectivePermissionKeys,
        accessToken,
        isAuthenticated: Boolean(user && accessToken),
        isLoading,
        login,
        logout,
        refreshSession,
        reloadCurrentUser,
        updateProfile,
      };
    },
    [
      activeOrganizationId,
      accessToken,
      isLoading,
      login,
      logout,
      effectivePermissionKeys,
      platformContext,
      memberships,
      navigationCatalog,
      refreshSession,
      reloadCurrentUser,
      setActiveOrganizationId,
      updateProfile,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}

export function getUserDisplayName(user: AuthUser | null): string {
  if (!user) {
    return "Bienvenido";
  }

  if (user.firstName?.trim()) {
    return `Bienvenido, ${user.firstName.trim()}`;
  }

  if (user.email?.includes("@")) {
    return `Bienvenido, ${user.email.split("@")[0]}`;
  }

  return "Bienvenido";
}

export function getUserSummaryName(user: AuthUser | null): string {
  if (!user) {
    return "Invitado";
  }

  const fullName = [user.firstName, user.lastName]
    .filter((value) => Boolean(value?.trim()))
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  if (user.email?.includes("@")) {
    return user.email.split("@")[0];
  }

  if (user.documentNumber?.trim()) {
    return user.documentNumber.trim();
  }

  return "Usuario Kapos";
}

export function getProfileStatus(user: AuthUser | null): string {
  if (!user) {
    return "Perfil basico";
  }

  const hasName = Boolean(user.firstName?.trim());
  const hasLastName = Boolean(user.lastName?.trim());
  const hasPhone = Boolean(user.phone?.trim());
  const hasDocument = Boolean(user.documentType && user.documentNumber?.trim());

  if (hasName && hasLastName && hasPhone && hasDocument) {
    return "Perfil completo para beneficios";
  }

  if (hasName || hasPhone) {
    return "Perfil parcialmente completo";
  }

  return "Perfil basico";
}

function getJwtExpirationMs(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(window.atob(normalizedPayload)) as { exp?: unknown };

    return typeof decodedPayload.exp === "number" ? decodedPayload.exp * 1000 : null;
  } catch {
    return null;
  }
}
