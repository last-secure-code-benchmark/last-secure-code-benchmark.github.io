export default function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-10 font-mono text-xs text-zinc-500 sm:flex-row">
        <p>
          <span className="text-acc">&gt;_</span> Last Secure Code Benchmark — a benchmark project page
        </p>
        <div className="flex items-center gap-5">
          <a href="https://arxiv.org/abs/0000.00000" className="hover:text-acc">Paper</a>
          <a href="https://github.com/your-org/your-repo" className="hover:text-acc">Code</a>
          <a href="https://your-blog.example.com/post" className="hover:text-acc">Blog</a>
        </div>
        <p className="flex items-center gap-4">
          <span>© {new Date().getFullYear()} Your Team</span>
          <span className="text-zinc-700" title="try it">
            ↑↑↓↓←→←→BA
          </span>
        </p>
      </div>
    </footer>
  );
}
