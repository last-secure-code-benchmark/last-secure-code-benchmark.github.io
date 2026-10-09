"use client";

import { usePathname } from "next/navigation";
import { withBase } from "@/lib/base";

const LINKS = [
  { href: "/#leaderboard", label: "Leaderboard", match: null },
  { href: "/#analysis", label: "Analysis", match: null },
  { href: "/#overview", label: "Overview", match: null },
  { href: "/#scoring", label: "Scoring", match: null },
  { href: "/#case-study", label: "Case Study", match: null },
  { href: "/#citation", label: "Citation", match: null },
  { href: "/traces", label: "Traces", match: "/traces" },
] as const;

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-6 font-mono text-xs text-zinc-400 sm:flex">
      {LINKS.map((l) => {
        const active = l.match != null && pathname.startsWith(l.match);
        return (
          <a key={l.href} href={withBase(l.href)} className={active ? "text-acc" : "hover:text-acc"}>
            {l.label}
          </a>
        );
      })}
    </nav>
  );
}
