"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  IconLayoutDashboard,
  IconClipboardList,
  IconChartLine,
  IconUser,
  IconShield,
} from "@tabler/icons-react";

export default function TabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    return null;
  }

  const isAdmin = session?.user?.role === "superadmin";

  const athleteTabs = [
    { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
    { href: "/programs", label: "Programs", icon: IconClipboardList },
    { href: "/progress", label: "Progress", icon: IconChartLine },
    { href: "/profile", label: "Profile", icon: IconUser },
  ];

  const tabs = isAdmin
    ? [{ href: "/admin", label: "Guardian", icon: IconShield }, ...athleteTabs]
    : athleteTabs;

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 flex h-16 w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-black bg-rubber">
      {tabs.map(({ href, label, icon: Icon }) => {
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
