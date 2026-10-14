"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/content/site";

export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open ? "bg-ink/90 backdrop-blur-md border-b border-line/60" : "bg-transparent"
      }`}
    >
      <div className="wrap flex h-16 items-center justify-between">
        <Link href="/" className="group flex items-center gap-3" aria-label="Sameer Goel, home">
          <img src="/img/emblem-256.png" alt="" width={30} height={26} className="opacity-80 transition-opacity group-hover:opacity-100" />
          <span className="wordmark text-[1.35rem] uppercase !leading-none !tracking-[-0.03em]">Sameer Goel</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-7 text-sm">
            {NAV.map((n) => {
              const active = path?.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative py-1 font-semibold transition-colors hover:text-ivory ${active ? "text-ivory" : "text-mist"}`}
                  >
                    {n.label}
                    {active && <span className="absolute -bottom-1 left-0 h-px w-full bg-copper" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          className="md:hidden -mr-2 p-2 label text-mist"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Mobile"
        hidden={!open}
        className="md:hidden h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line/60 bg-ink"
      >
        <ul className="wrap flex flex-col gap-1 py-8">
          {NAV.map((n, i) => (
            <li key={n.href}>
              <Link href={n.href} className="flex items-baseline gap-4 py-3 display text-3xl">
                <span className="label text-copper">0{i + 1}</span>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
