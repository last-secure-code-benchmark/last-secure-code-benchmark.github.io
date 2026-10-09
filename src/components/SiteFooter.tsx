export default function SiteFooter() {
  return (
    <footer className="band">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-10 font-mono text-xs text-zinc-500 sm:flex-row">
        <p className="brand brand-small">
          <svg viewBox="0 0 24 24" className="brand-mark" aria-hidden="true">
            <rect x="1.5" y="1.5" width="21" height="21" rx="6" className="bm-frame" />
            <rect x="6" y="7" width="9" height="2.2" rx="1.1" className="bm-line" />
            <rect x="6" y="10.9" width="12" height="2.2" rx="1.1" className="bm-secure" />
            <rect x="6" y="14.8" width="6.5" height="2.2" rx="1.1" className="bm-line" />
          </svg>
          <span>Last Secure Code Benchmark</span>
        </p>
        <div className="flex items-center gap-5">
          <a href="https://github.com/alibaba/last-secure-code-benchmark" className="hover:text-acc">Code</a>
          <a href="https://hub.harborframework.com/datasets/last-secure-code-benchmark/last-secure-code-benchmark" className="hover:text-acc">Harbor Hub</a>
        </div>
        <p className="flex items-center gap-4">
          <span>© {new Date().getFullYear()} LSCBench</span>
          <span className="text-zinc-700" title="try it">
            ↑↑↓↓←→←→BA
          </span>
        </p>
      </div>
    </footer>
  );
}
