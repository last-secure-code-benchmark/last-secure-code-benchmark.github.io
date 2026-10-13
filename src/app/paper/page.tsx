import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { withBase } from "@/lib/base";

const PDF = withBase("/lscbench.pdf");

export const metadata: Metadata = {
  title: "Paper · Last Secure Code Benchmark",
  description: "Read the LSCBench paper, Last Secure Code Benchmark: Is the Code You Vibe Secure?",
};

export default function PaperPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 band-v">
        <section className="section">
          <div className="container-page">
            <div className="max-w-2xl">
              <p className="section-kicker">full text</p>
              <h1 className="section-title mt-2">Paper</h1>
              <p className="mt-3 text-sm text-zinc-400">
                Last Secure Code Benchmark: Is the Code You Vibe Secure? How the 450 tasks are built
                and graded, results for six frontier agents, and the appendices with construction
                details and case studies.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href={PDF} target="_blank" rel="noopener" className="btn btn-primary">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Open PDF
                </a>
                <a href={PDF} download="LSCBench.pdf" className="btn btn-ghost">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </a>
              </div>
            </div>
            {/* phones open the PDF in their own viewer instead; embedded, they show only the first page */}
            <object data={PDF} type="application/pdf" className="paper-frame mt-8 hidden sm:block" aria-label="LSCBench paper">
              <p className="p-6 text-sm text-zinc-400">
                This browser cannot show the PDF here.{" "}
                <a href={PDF} className="text-acc">
                  Open it in a new tab
                </a>
                .
              </p>
            </object>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
