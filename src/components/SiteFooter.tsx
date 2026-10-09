export default function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-10 font-mono text-xs text-zinc-500 sm:flex-row">
        <p>
          <span className="text-acc">&gt;_</span> Last Secure Code Benchmark — a benchmark project page
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
