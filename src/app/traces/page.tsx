import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import TracesBrowser from "@/components/TracesBrowser";

export const metadata: Metadata = {
  title: "Traces · Last Secure Code Benchmark",
  description: "Browse per-task agent runs: full turn-by-turn trajectories, verifier verdicts, and workspace artifacts.",
};

export default function TracesPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="section">
          <div className="container-page">
            <div className="max-w-2xl">
              <p className="section-kicker">agent runs</p>
              <h1 className="section-title mt-2">Traces</h1>
              <p className="mt-3 text-sm text-zinc-400">
                Every run, end to end: the agent&apos;s turns and tool calls, the verifier&apos;s
                functional / secure verdict, and the files left in the workspace.
                F∧S = solved, (1,0) = tests pass but the vulnerability remains.
              </p>
            </div>
            <div className="mt-8">
              <TracesBrowser />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
