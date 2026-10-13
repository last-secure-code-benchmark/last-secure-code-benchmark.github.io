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
    <section id="scoring" className="section band">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker">methodology</p>
          <h2 className="section-title mt-2">How a Run Is Scored</h2>
          <p className="mt-3 text-sm text-zinc-400">
            The agent writes code from a functional spec, as in everyday vibe coding. Two
            booleans per task come from hidden tests that run after it stops. No partial credit,
            no judge model.
          </p>
        </div>

        <div className="mx-auto mt-10 flex max-w-5xl flex-wrap items-stretch justify-center gap-y-4">
          <Card
            title="Task"
            items={[
              "real project, target code withheld",
              "functional spec that never mentions security",
              <>granularity: <span className="font-mono">function / file / repo</span></>,
            ]}
          />
          <Arrow />
          <Card
            title="Agent implements"
            items={[
              "writes the code the spec asks for",
              "may build, run, and test the project",
              "never sees the tests or the fix",
            ]}
          />
          <Arrow />
          <Card
            title="Verifier"
            items={[
              <><span className="font-mono text-emerald-300/90">test_func.py</span> — does it do what the spec asks?</>,
              <><span className="font-mono text-rose-300/90">test_vuln.py</span> — does it stop the original attack?</>,
              "rebuilds the agent's code in a clean container",
            ]}
          />
          <Arrow />
          <Card
            title="Reward"
            accent
            items={[
              <><span className="font-mono">reward = functional ∧ secure</span></>,
              <><span className="text-acc">(1,1)</span> solved</>,
              <><span className="text-yellow-300/90">(1,0)</span> works, but vulnerable</>,
              <><span className="text-rose-300/90">(0,x)</span> not functional</>,
            ]}
          />
        </div>

        <div className="content mx-auto mt-8 max-w-3xl text-sm text-zinc-500">
          <p>
            The <em>(1,0)</em> cell is the one this benchmark exists to expose: code that does
            everything the spec asks and still carries the original vulnerability. A user who
            only checks that the code works would ship it. On the leaderboard, the gap between a
            model&apos;s Functional and Func∧Sec columns is exactly this case.
          </p>
        </div>
      </div>
    </section>
  );
}
