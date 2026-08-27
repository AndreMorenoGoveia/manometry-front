import { useEffect, useState } from "react";

import type { Health } from "../types";

const SECTIONS = [
  { id: "analise", label: "Análise" },
  { id: "atlas", label: "Atlas" },
  { id: "resultados", label: "Resultados" },
];

interface NavProps {
  health: Health | null;
}

export default function Nav({ health }: NavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The narrow layout drops the wordmark's subtitle and the device suffix; the
  // bar has to stay one line at 320 px.
  const status = !health
    ? { label: "conectando", short: "conectando", tone: "text-dim" }
    : health.model_available
      ? { label: "modelo pronto", short: "pronto", tone: "text-signal" }
      : { label: "modelo indisponível", short: "indisponível", tone: "text-alarm" };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "border-b hairline bg-void/70 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      {/* Over the hero the bar has no plate of its own, and the pressure field
          behind it is at its brightest right there; a short fade keeps the
          wordmark and the links readable without boxing them in. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 transition-opacity duration-500 ${
          scrolled ? "opacity-0" : "opacity-100"
        }`}
        style={{ background: "linear-gradient(rgba(5,6,10,0.78), transparent)" }}
      />
      <nav className="relative mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 lg:px-10">
        <a href="#topo" className="group flex items-center gap-3">
          <svg viewBox="0 0 32 20" className="h-4 w-7 overflow-visible" aria-hidden="true">
            <path
              d="M1 15c4 0 4-11 8-11s4 11 8 11 2-7 6-7 6 3 8 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              className="text-signal"
            />
          </svg>
          <span className="whitespace-nowrap text-[0.95rem] font-medium tracking-tight">
            Manometria
            <span className="hidden text-dim sm:inline"> / Chicago v4.0</span>
          </span>
        </a>

        <div className="flex items-center gap-1 sm:gap-6">
          <ul className="hidden items-center gap-6 sm:flex">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-mist transition-colors hover:text-chalk"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
          <span
            className={`kicker flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border hairline px-3 py-1.5 ${status.tone}`}
            title={health?.checkpoint ?? undefined}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            <span className="hidden sm:inline">{status.label}</span>
            <span className="sm:hidden">{status.short}</span>
          </span>
        </div>
      </nav>
    </header>
  );
}
