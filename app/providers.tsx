"use client";

import { AuthProvider } from "./context/auth-context";
import { NotificationsProvider } from "./context/notifications-context";
import { ToastProvider } from "./context/toast-context";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationsProvider>{children}</NotificationsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
