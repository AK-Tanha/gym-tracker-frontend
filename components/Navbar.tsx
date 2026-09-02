"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-1/2 z-20 flex h-14 w-full max-w-md -translate-x-1/2 items-center border-b border-black bg-rubber px-4">
      <Link href="/dashboard" className="flex items-center">
        <span className="relative">
          <span className="flex aspect-square h-9 -skew-x-6 items-center justify-center rounded-[5px] bg-plate-red">
            <span className="-skew-x-[-6px] font-display text-[15px] font-bold italic text-white">
              SF
            </span>
          </span>
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-[3px] border-iron bg-plate-yellow" />
        </span>
        <span className="ml-2 font-display text-[16px] font-bold leading-none">
          <span className="text-chalk">STAT</span>
          <span className="text-plate-red">·FIT</span>
        </span>
      </Link>
    </nav>
  );
}
