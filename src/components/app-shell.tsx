import type { ReactNode } from "react";
import { LogoutButton } from "./logout-button";
import { Sidebar } from "./sidebar";

type AppShellProps = {
  children: ReactNode;
  userEmail?: string;
};

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className="workspace-background relative min-h-screen overflow-hidden px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,8,14,0.32)_78%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl flex-col rounded-[36px] border border-cyan-100/35 bg-slate-950/18 p-4 shadow-[0_0_42px_rgba(126,231,255,0.22)] backdrop-blur-md lg:min-h-[calc(100vh-4rem)] lg:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="pl-2">
            <p className="text-2xl font-semibold text-white drop-shadow">Financial Report Intelligence</p>
            <p className="mt-1 text-sm text-cyan-50/72">
              Nền tảng phân tích báo cáo tài chính chuyên nghiệp
            </p>
          </div>

          {userEmail ? (
            <div className="glass-control flex flex-col gap-3 rounded-2xl px-3 py-3 sm:flex-row sm:items-center">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-cyan-200/30 text-sm font-semibold">
                DN
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-cyan-50/70">Đã đăng nhập</p>
                <p className="max-w-56 truncate text-sm font-medium text-cyan-50">{userEmail}</p>
              </div>
              <LogoutButton />
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <Sidebar />
          <main className="glass-panel min-w-0 flex-1 rounded-[28px] p-4 sm:p-5 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
