"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import SideBar from "../components/SideBar";
import { ErpRouteGuard } from "../components/ErpRouteGuard";
import { useAuth } from "../context/auth-context";

type ErpLayoutProps = {
  children: ReactNode;
};

export default function ErpLayout({ children }: ErpLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--kapos-background)] text-[var(--kapos-text-soft)]">
        Validando acceso al ERP...
      </main>
    );
  }

  return (
    <div className="min-h-screen overflow-y-hidden bg-[var(--kapos-background)]">
      <div className="mx-auto flex max-h-screen w-full overflow-y-hidden">
        <SideBar />

        <main className="min-w-0 overflow-y-hidden flex-1 px-4 py-6 lg:pr-6">
          <div className="min-h-[calc(100vh-3rem)] overflow-y-hidden rounded-[34px] border border-[var(--kapos-border)] bg-white/82 p-4   md:p-6">
            <div className="min-w-0 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[28px] p-3 md:p-5">
              <ErpRouteGuard>{children}</ErpRouteGuard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
