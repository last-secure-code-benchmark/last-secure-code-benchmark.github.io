const STATS = [
  { num: "450", label: "total tasks" },
  { num: "150", label: "vulnerability scenarios" },
  { num: "3", label: "granularities" },
  { num: "2", label: "checks per run" },
];

const SETUP: [string, string][] = [
  ["Scenarios", "150 real vulnerabilities: 115 public CVEs and 35 Java applications that security experts built from vulnerabilities in industry codebases; each yields one task per granularity"],
  ["Granularities", "function · file · repository — fill in masked code, write removed files, or rebuild an emptied source tree"],
  ["Agent prompt", "a functional specification that says what the code must do and never mentions security"],
  ["Verifier", "hidden functional and security suites written by security experts, run in a separate container after the agent stops"],
  ["Reward", "functional ∧ secure — both must hold"],
];

export default function Overview() {
  return (
    <section id="overview" className="section band">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker">overview</p>
          <h2 className="section-title mt-2">What is Last Secure Code Benchmark?</h2>
        </div>
        <div className="content mx-auto mt-8 max-w-3xl">
          <p>
            Coding agents are good at making code <em>run</em>. Last Secure Code Benchmark asks the harder
            question: is the code they write <em>safe</em>? Each task hands the agent a real-world
            project with part of its code withheld, plus a functional specification of what that
            code must do, the way a developer asks for code when vibe coding. The withheld code is
            where a known vulnerability lived, but the spec <em>never mentions security</em>: every
            requirement holds for both the vulnerable and the fixed code, so it neither hints at the
            fix nor steers toward the flaw. Recognizing the risk is left to the agent, as it is in
            everyday use.
          </p>
          <p>
            A submission only counts if it passes two independent checks, both hidden from the
            agent: <strong className="text-zinc-200">functional</strong> — tests of the behavior the
            spec asks for — and <strong className="text-zinc-200">secure</strong> — tests that replay
            the original attack against the running program and check that it does not succeed.
            Reward is their AND. Code that does everything the spec asks but stays open to the
            attack is scored as the failure mode it is.
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
            <strong className="text-zinc-200">Function</strong> masks the code regions where the
            vulnerability lived and keeps the rest of the project intact — a focused,
            fill-in-the-blank setting with the most detailed spec.{" "}
            <strong className="text-zinc-200">File</strong> removes the files that contained them;
            the agent writes each one from its spec in <span className="font-mono">/file_specs/</span>.{" "}
            <strong className="text-zinc-200">Repository</strong> empties a declared source tree
            around them, up to the whole repository, and the agent rebuilds it from{" "}
            <span className="font-mono">/app/spec.md</span>, the coarsest spec of the three. Every
            scenario appears at all three granularities, so the same vulnerabilities are compared as
            the agent writes more and more of the code itself.
          </p>
        </div>
      </div>
    </section>
  );
}
