import { withBase } from "@/lib/base";

export default function Hero() {
  return (
    <div className="hero-glow bg-grid overflow-hidden border-b border-line">
      <div className="container-page relative z-10 pb-16 pt-16 text-center sm:pb-20 sm:pt-24">
        <h1
          className="mx-auto font-mono text-5xl font-bold tracking-tight text-zinc-50 sm:text-6xl"
        >
          Last Secure Code Benchmark
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-xl font-medium text-zinc-300 sm:text-2xl">
          Is the Code You Vibe Secure?
        </p>

        <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-zinc-400">
          <span className="font-mono text-acc">450</span> tasks built from{" "}
          <span className="font-mono text-acc">150</span> real vulnerabilities — 7 languages, 115
          CVEs, 24 CWEs. Each task asks the agent to implement a functional specification that{" "}
          <em>never mentions security</em>, but whose required behavior is derived from a real
          vulnerability fix. A submission counts only when the project&apos;s tests pass{" "}
          <em>and</em> the original exploit fails.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href="https://github.com/alibaba/last-secure-code-benchmark" target="_blank" rel="noopener" className="btn btn-primary">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
            </svg>
            Code
          </a>
          <a href="https://hub.harborframework.com/datasets/last-secure-code-benchmark/last-secure-code-benchmark" target="_blank" rel="noopener" className="btn btn-ghost">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
              <path d="m3 8 9 5 9-5M12 13v8" />
            </svg>
            Harbor Hub
          </a>
          <a href={withBase("/traces")} className="btn btn-ghost">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            Traces
          </a>
        </div>
      </div>
    </div>
  );
}
