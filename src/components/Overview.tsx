const STATS = [
  { num: "450", label: "total tasks" },
  { num: "150", label: "real-world CVEs" },
  { num: "3", label: "context tiers" },
  { num: "2", label: "checks per run" },
];

const SETUP: [string, string][] = [
  ["Task source", "150 real CVEs in open-source projects; each yields one task per context tier"],
  ["Context tiers", "function-level · file-level · repo-level — the same vulnerability under three context sizes"],
  ["Agent prompt", "a functional specification that never mentions security, derived from the real vulnerability fix"],
  ["Verifier", "the project's own test suite + the original exploit PoC, run after the agent stops"],
  ["Reward", "functional ∧ secure — both must hold"],
];

export default function Overview() {
  return (
    <section id="overview" className="section border-b border-line">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker">overview</p>
          <h2 className="section-title mt-2">What is Last Secure Code Benchmark?</h2>
        </div>
        <div className="content mx-auto mt-8 max-w-3xl">
          <p>
            Coding agents are good at making code <em>run</em>. Last Secure Code Benchmark asks the harder
            question: can they make code <em>safe</em>? Each task hands the agent a real
            open-source project with part of its code removed, plus a functional specification of
            what to rebuild. The spec <em>never mentions security</em> — but the behavior it
            demands is derived from a real vulnerability fix, so a correct implementation must
            close the hole without ever being told there is one.
          </p>
          <p>
            A submission only counts if it passes two independent checks:{" "}
            <strong className="text-zinc-200">functional</strong> — the project&apos;s own test
            suite still passes — and <strong className="text-zinc-200">secure</strong> — the
            original exploit no longer works. Reward is their AND. Code that keeps the tests
            green but leaves the hole open is scored as the failure mode it is.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="card text-center">
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* PTB-style setup grid */}
        <dl className="mx-auto mt-10 max-w-3xl border-t border-line">
          {SETUP.map(([dt, dd]) => (
            <div key={dt} className="grid gap-1 border-b border-line py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="font-mono text-xs uppercase tracking-wider text-zinc-500">{dt}</dt>
              <dd className="text-sm text-zinc-300">{dd}</dd>
            </div>
          ))}
        </dl>

        <div className="content mx-auto mt-10 max-w-3xl">
          <p>
            <strong className="text-zinc-200">Function-tier</strong> masks out just the vulnerable
            regions of an otherwise intact file — a focused, fill-in-the-blank setting.{" "}
            <strong className="text-zinc-200">File-tier</strong> deletes the whole file; the agent
            reconstructs it from a spec in <span className="font-mono">/file_specs/</span>.{" "}
            <strong className="text-zinc-200">Repo-tier</strong> removes the entire owning
            component, leaving only <span className="font-mono">/app/spec.md</span> — the agent
            must recreate every required path and interface from scratch. The same CVE at three
            tiers measures how much surrounding context an agent needs to write code that is both
            correct and safe.
          </p>
        </div>
      </div>
    </section>
  );
}
