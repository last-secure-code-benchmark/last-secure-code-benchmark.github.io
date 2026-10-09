"use client";

import { useMemo, useState } from "react";
import { withBase } from "@/lib/base";
import rawData from "@/data/leaderboard.json";
import type { LeaderboardData, ResultRow } from "@/lib/types";

const data = rawData as LeaderboardData;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

type FocusFilter = "all" | "model" | "agent";

const fnTotal = (r: ResultRow) =>
  (r.functional_split?.function || 0) + (r.functional_split?.file || 0) + (r.functional_split?.repo || 0);

/** "Name (note)" -> name with a dotted-underline cue revealing the note on hover. */
function NameWithNote({ value }: { value?: string }) {
  const s = value || "";
  const i = s.indexOf(" (");
  if (i === -1) return <>{s}</>;
  const note = s.slice(i + 1, s.lastIndexOf(")"));
  return (
    <span className="note-cue" data-tip={note}>
      {s.slice(0, i)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* cells                                                               */
/* ------------------------------------------------------------------ */

function AgentCell({ row }: { row: ResultRow }) {
  const isAgent = (row.focus || "model") === "agent";
  const headline = isAgent ? row.agent : row.model;
  const secondary = isAgent ? row.model : row.agent;
  const source = row.source_url ? (
    <a href={row.source_url} target="_blank" rel="noopener">
      {row.source} ↗
    </a>
  ) : (
    row.source
  );
  const meta = [secondary, row.eval_note, source].filter(Boolean);

  return (
    <div>
      <span className="font-semibold text-zinc-100">
        <NameWithNote value={headline} />
        <span className={`lb-tag ${isAgent ? "lb-tag-agent" : ""}`}>{isAgent ? "Agent" : "Model"}</span>
      </span>
      {meta.length > 0 && (
        <span className="lb-meta">
          {meta.map((m, i) => (
            <span key={i}>
              {i > 0 && " · "}
              {typeof m === "string" ? <NameWithNote value={m} /> : m}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

/** cybergym 式百分比单元格：数字 + 细圆角条（条长 = 做对了多少） */
function PctBar({ n, total, strong }: { n?: number | null; total?: number; strong?: boolean }) {
  if (n == null || !total) return <span className="font-mono text-sm text-zinc-700">—</span>;
  const pct = (n / total) * 100;
  return (
    <div className="min-w-24" data-tip={`${n} / ${total}`}>
      <div className={`font-mono text-sm tabular-nums ${strong ? "font-bold text-acc" : "text-zinc-200"}`}>
        {pct.toFixed(1)}%
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-acc/15">
        <div
          className={`h-full rounded-full ${strong ? "bg-acc" : "bg-acc/70"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* main component                                                      */
/* ------------------------------------------------------------------ */

const TH = "px-4 py-3 text-left font-medium";
const THR = "px-4 py-3 text-left font-medium";
const TD = "px-4 py-3.5";

export default function Leaderboard() {
  const [focus, setFocus] = useState<FocusFilter>("all");

  const rows = useMemo(() => (data.results || []).filter((r) => !r.hidden), []);
  const inst = data.instances;

  const visible = useMemo(
    () =>
      rows
        .filter((r) => focus === "all" || (r.focus || "model") === focus)
        .sort((a, b) => (b.on_target ?? 0) - (a.on_target ?? 0)),
    [rows, focus],
  );

  const focusPills: { value: FocusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "model", label: "Model-focused" },
    { value: "agent", label: "Agent-focused" },
  ];

  /** 每档分母：优先行内任务列表，否则用全局实例数 */
  const tierTotal = (row: ResultRow, tier: "function" | "file" | "repo") =>
    row.tasks?.length ? row.tasks.filter((t) => t.tier === tier).length : inst[tier];
  const rowTotal = (row: ResultRow) => row.n_total ?? inst.total;
  /** secure=1 计数：只能由行内任务列表算出 */
  const secureCount = (row: ResultRow) =>
    row.tasks?.length ? row.tasks.filter((t) => t.secure).length : undefined;
  const functionalCount = (row: ResultRow) =>
    row.tasks?.length ? row.tasks.filter((t) => t.functional).length : row.functional_split ? fnTotal(row) : undefined;

  /** 场景（CVE）id：去掉任务名的 _function/_file/_repo 后缀 */
  const baseOf = (id: string) => id.replace(/_(function|file|repo)$/, "");
  /** 三档全解的场景数：function ∧ file ∧ repo 都 reward=1 */
  const allTiersSolved = (row: ResultRow) => {
    if (!row.tasks?.length) return undefined;
    const tiers = new Map<string, Set<string>>();
    for (const t of row.tasks) {
      if (!t.solved || !t.tier) continue;
      const b = baseOf(t.id);
      if (!tiers.has(b)) tiers.set(b, new Set());
      tiers.get(b)!.add(t.tier);
    }
    let n = 0;
    for (const s of tiers.values()) if (s.size === 3) n++;
    return n;
  };
  /** 分母：三档任务都在的场景数 */
  const scenarioTotal = (row: ResultRow) => {
    if (!row.tasks?.length) return undefined;
    const tiers = new Map<string, Set<string>>();
    for (const t of row.tasks) {
      if (!t.tier) continue;
      const b = baseOf(t.id);
      if (!tiers.has(b)) tiers.set(b, new Set());
      tiers.get(b)!.add(t.tier);
    }
    let n = 0;
    for (const s of tiers.values()) if (s.size === 3) n++;
    return n;
  };

  const rankCell = (i: number) => (
    <td className={`${TD} lb-rank ${i < 3 ? `lb-rank-${i + 1}` : ""}`}>{String(i + 1).padStart(2, "0")}</td>
  );

  return (
    <section id="leaderboard" className="section border-b border-line">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker">results</p>
          <h2 className="section-title mt-2">Leaderboard</h2>
          <p className="mt-3 text-sm text-zinc-400">
            reward = <b className="text-zinc-200">functional ∧ secure</b> — the project&apos;s tests still pass
            <em> and </em>the vulnerability is actually closed.
          </p>
        </div>

        {/* filters */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="font-mono text-xs text-zinc-500">Type:</span>
          {focusPills.map((p) => (
            <button
              key={p.value}
              className={`pill ${focus === p.value ? "pill-active" : ""}`}
              onClick={() => setFocus(p.value)}
            >
              {p.label}
            </button>
          ))}
          <a href={withBase("/traces")} className="subrow-toggle ml-4">browse per-task traces →</a>
        </div>

        {/* table 1: reward by context tier */}
        <div className="card mt-6 overflow-hidden !p-0">
          <div className="term-bar dark-pane">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
            <span className="ml-3 font-mono text-xs text-zinc-500">
              home@lscb:~/results$ ./report --by tier
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-xs uppercase tracking-wider text-zinc-500">
                  <th className={TH}>#</th>
                  <th className={TH}>Agent</th>
                  <th className={THR} data-tip="reward=1 on function-level tasks">Function</th>
                  <th className={THR} data-tip="reward=1 on file-level tasks">File</th>
                  <th className={THR} data-tip="reward=1 on repo-level tasks">Repo</th>
                  <th className={THR} data-tip="scenarios solved at ALL THREE tiers: function ∧ file ∧ repo">All tiers</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row, i) => (
                  <tr key={`t1-${row.model}-${i}`} className="lb-row border-b border-line/60">
                    {rankCell(i)}
                    <td className={TD}><AgentCell row={row} /></td>
                    <td className={TD}><PctBar n={row.function} total={tierTotal(row, "function")} /></td>
                    <td className={TD}><PctBar n={row.file} total={tierTotal(row, "file")} /></td>
                    <td className={TD}><PctBar n={row.repo} total={tierTotal(row, "repo")} /></td>
                    <td className={TD}><PctBar n={allTiersSolved(row)} total={scenarioTotal(row)} strong /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* table 2: by verifier check */}
        <div className="card mt-6 overflow-hidden !p-0">
          <div className="term-bar dark-pane">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
            <span className="ml-3 font-mono text-xs text-zinc-500">
              home@lscb:~/results$ ./report --by check
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-xs uppercase tracking-wider text-zinc-500">
                  <th className={TH}>#</th>
                  <th className={TH}>Agent</th>
                  <th className={THR} data-tip="project tests pass (vuln may remain)">Functional test</th>
                  <th className={THR} data-tip="original exploit no longer works">Security test</th>
                  <th className={THR} data-tip="functional AND secure">Reward (F∧S)</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row, i) => (
                  <tr key={`t2-${row.model}-${i}`} className="lb-row border-b border-line/60">
                    {rankCell(i)}
                    <td className={TD}><AgentCell row={row} /></td>
                    <td className={TD}><PctBar n={functionalCount(row)} total={rowTotal(row)} /></td>
                    <td className={TD}><PctBar n={secureCount(row)} total={rowTotal(row)} /></td>
                    <td className={TD}><PctBar n={row.on_target} total={rowTotal(row)} strong /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <details className="content mx-auto mt-6 max-w-3xl text-sm text-zinc-500">
          <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-zinc-500 hover:text-acc">
            Methodology &amp; caveats
          </summary>
          <p className="mt-3">
            Each task is scored on two independent booleans: <em>functional</em> (the project&apos;s
            own tests still pass) and <em>secure</em> (the original exploit no longer works);
            reward is their AND. The first table breaks reward down by task tier — its last column
            is the strictest cut: scenarios where the agent solved <em>all three</em> context tiers.
            In the second table, the gap between Functional and Reward is the dominant <em>(1,0)</em>
            failure mode: code runs, vulnerability stays.
            Bars show the share of tasks solved; hover a cell for exact counts.
          </p>
        </details>
      </div>
    </section>
  );
}
