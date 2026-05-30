"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const navItems: NavItem[] = [
  { label: "Tổng quan", href: "/dashboard", icon: "⌂" },
  { label: "Tải báo cáo", href: "/upload", icon: "⇧" },
  { label: "Danh sách báo cáo", href: "/reports", icon: "▤" },
  { label: "Cài đặt", href: "/settings", icon: "⚙" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-panel flex shrink-0 flex-col gap-5 rounded-[28px] p-4 lg:w-64">
      <Link
        href="/"
        className="px-2 text-xl font-semibold tracking-[0.34em] text-cyan-100 drop-shadow-[0_0_10px_rgba(111,231,255,0.8)]"
        aria-label="Trang chủ Financial Report Intelligence"
      >
        FRI
      </Link>

      <div className="mx-auto grid h-8 w-8 grid-cols-3 gap-1 opacity-80">
        {Array.from({ length: 9 }).map((_, index) => (
          <span key={index} className="h-1.5 w-1.5 rounded-full bg-white/80" />
        ))}
      </div>

      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "glass-control flex min-w-max items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-cyan-50/88 transition hover:text-white",
                isActive ? "cyan-glow bg-cyan-300/18 text-white" : "",
              ].join(" ")}
            >
              <span className="grid h-6 w-6 place-items-center rounded-lg border border-white/20 text-base">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
