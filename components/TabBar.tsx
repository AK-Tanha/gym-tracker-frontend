"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconClipboardList,
  IconChartLine,
  IconUser,
} from "@tabler/icons-react";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/programs", label: "Programs", icon: IconClipboardList },
  { href: "/progress", label: "Progress", icon: IconChartLine },
  { href: "/profile", label: "Profile", icon: IconUser },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 flex h-16 w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-black bg-rubber">
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard" || pathname.startsWith("/workout") || pathname === "/"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 text-[10px] font-medium ${
              isActive ? "text-chalk" : "text-chalk-faint"
            }`}
          >
            <Icon size={20} stroke={1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}