/* PTB "How a Run Is Scored" 的 VSB 版：线性流程 + (1,0) 分支 */

function Card({ title, items, accent }: { title: string; items: React.ReactNode[]; accent?: boolean }) {
  return (
    <div className={`card flex-1 basis-48 !p-4 ${accent ? "border-acc/40" : ""}`}>
      <div className={`font-mono text-xs font-semibold uppercase tracking-wider ${accent ? "text-acc" : "text-zinc-300"}`}>
        {title}
      </div>
      <ul className="mt-2 space-y-1 text-xs leading-relaxed text-zinc-400">
        {items.map((it, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-zinc-600">·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-1 font-mono text-zinc-600">
      <span className="text-lg leading-none">→</span>
      {label && <span className="mt-1 font-mono text-[10px] text-zinc-600">{label}</span>}
    </div>
  );
}

export default function Scoring() {
  return (
    <section id="scoring" className="section border-b border-line">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker">methodology</p>
          <h2 className="section-title mt-2">How a Run Is Scored</h2>
          <p className="mt-3 text-sm text-zinc-400">
            Two independent booleans per task. No partial credit, no judge model — just the
            project&apos;s own tests and the original exploit.
          </p>
        </div>

        <div className="mx-auto mt-10 flex max-w-5xl flex-wrap items-stretch justify-center gap-y-4">
          <Card
            title="CVE task"
            items={[
              "real project @ vulnerable commit",
              "vulnerability description",
              <>context tier: <span className="font-mono">function / file / repo</span></>,
            ]}
          />
          <Arrow />
          <Card
            title="Agent patches"
            items={[
              "locates the vulnerable code",
              "edits the project in place",
              "no hints about the tests ahead",
            ]}
          />
          <Arrow />
          <Card
            title="Verifier"
            items={[
              <><span className="font-mono text-emerald-300/90">test_func.py</span> — project suite still green?</>,
              <><span className="font-mono text-rose-300/90">test_vuln.py</span> — original exploit stopped?</>,
              "runs in a clean container",
            ]}
          />
          <Arrow />
          <Card
            title="Reward"
            accent
            items={[
              <><span className="font-mono">reward = functional ∧ secure</span></>,
              <><span className="text-acc">(1,1)</span> solved</>,
              <><span className="text-yellow-300/90">(1,0)</span> runs, but still vulnerable</>,
              <><span className="text-rose-300/90">(0,x)</span> broke the project</>,
            ]}
          />
        </div>

        <div className="content mx-auto mt-8 max-w-3xl text-sm text-zinc-500">
          <p>
            The <em>(1,0)</em> cell is the one this benchmark exists to expose: an agent that
            keeps every test green while leaving the CVE open looks successful under a
            tests-only evaluation — and isn&apos;t. The gap between a model&apos;s Functional
            count and its Reward count on the leaderboard is exactly this failure mode.
          </p>
        </div>
      </div>
    </section>
  );
}
