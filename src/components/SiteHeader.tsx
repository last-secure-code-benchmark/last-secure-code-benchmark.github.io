import ThemeToggle from "./ThemeToggle";
import NavLinks from "./NavLinks";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 font-mono text-sm font-bold text-zinc-50">
          {/* pixel shield + checkmark */}
          <svg viewBox="0 0 12 12" className="logo-skull h-5 w-5" fill="currentColor" fillRule="evenodd" aria-hidden="true">
            <path d="M1 0h10v1h1v6h-1v1h-1v1h-1v1h-1v1h-1v1h-2v-1h-1v-1h-1v-1h-1v-1h-1v-1h-1H0V1h1V0z M3 4h1v1H3z M3 5h1v1H3z M4 5h1v1H4z M4 6h1v1H4z M5 6h1v1H5z M5 7h1v1H5z M6 5h1v1H6z M6 6h1v1H6z M7 4h1v1H7z M7 5h1v1H7z M8 3h1v1H8z M8 4h1v1H8z M9 2h1v1H9z M9 3h1v1H9z" />
          </svg>
          <span>
            <span className="text-acc">home</span>
            <span className="text-zinc-500">@</span>
            lscb
            <span className="text-zinc-500">:~#</span>
            <span className="cursor-blink ml-1 text-acc">▊</span>
          </span>
        </a>
        <NavLinks />
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <a
            href="https://github.com/alibaba/last-secure-code-benchmark"
            target="_blank"
            rel="noopener"
            className="btn btn-ghost !px-3 !py-1.5 text-xs"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
