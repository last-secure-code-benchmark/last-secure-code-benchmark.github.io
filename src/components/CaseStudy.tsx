import { withBase } from "@/lib/base";

export default function CaseStudy() {
  return (
    <section id="case-study" className="section border-b border-line">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker">deep dive</p>
          <h2 className="section-title mt-2">Example: A Full Trajectory</h2>
        </div>
        <div className="content mx-auto mt-8 max-w-3xl">
          <p>
            One real run from the leaderboard: <strong className="text-zinc-200">CVE-2020-28451 ·
            image-tiler (file tier)</strong>, solved by GPT-5.6-Sol / Codex. The agent received the
            file spec and the project&apos;s immutable tests, and had to supply a working{" "}
            <code>index.js</code> that keeps the suite green <em>and</em> the vulnerability closed.
          </p>
          <p>
            The shape of the run is typical of successful solves: a short reconnaissance burst
            (reading the spec, the retained tests, and the expected image tiles), a single-shot
            implementation, one test run — then roughly half the run spent{" "}
            <em>probing its own work</em>: tile counts, formats, and CLI behavior, before it
            stopped. <code>42 turns</code>, <code>19 tool calls</code>, <code>5.8 minutes</code>.
            The complete turn-by-turn trace is in the{" "}
            <a href={withBase("/traces")} className="text-acc hover:underline">traces browser</a>.
          </p>
          <p>
            Caveats: this is one run of one agent on one task, drawn from a small scored sample —
            it shows what a successful trajectory <em>looks like</em>, not how often they occur.
            For the aggregate picture see the <a href={withBase("/#leaderboard")} className="text-acc hover:underline">leaderboard</a>;
            failed and <em>(1,0)</em> runs look very different and are browsable in the same place.
          </p>
        </div>
      </div>
    </section>
  );
}
