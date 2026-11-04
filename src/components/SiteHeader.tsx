"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/trends", label: "Trends" },
  { href: "/daily-patterns", label: "Daily patterns" },
  { href: "/data-centers", label: "Data centers" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="font-serif text-xl font-semibold tracking-tight text-ink">
          Texas Grid Watch
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} active={pathname === l.href} />
          ))}
          <span className="ml-2">
            <ThemeToggle />
          </span>
        </nav>

        <button
          type="button"
          className="rounded border border-line px-3 py-2 text-sm md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          {NAV_LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} active={pathname === l.href} onNavigate={() => setOpen(false)} />
          ))}
          <div className="pt-2">
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  );
}

function NavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`rounded px-3 py-2 text-sm ${
        active ? "font-semibold text-accent underline underline-offset-8" : "text-ink hover:text-accent"
      }`}
    >
      {label}
    </Link>
  );
}
