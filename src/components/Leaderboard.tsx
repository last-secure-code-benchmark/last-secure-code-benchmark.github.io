"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import { withBase } from "@/lib/base";

export type LbRow = {
  model: string;
  agent: string;
  func: number;
  sec: number;
  joint: number;
  scenarioJoint: number;
  tiers: { function: number; file: number; repo: number };
};

type Col = { label: string; tip: string; value: (r: LbRow) => number; main?: boolean };

const VIEWS: Record<"overall" | "granularity", { name: string; cols: Col[] }> = {
  overall: {
    name: "Overall",
    cols: [
      { label: "Func∧Sec", tip: "Both the functional and the security suite pass", value: (r) => r.joint, main: true },
      { label: "Functional", tip: "The functional suite passes", value: (r) => r.func },
      { label: "Secure", tip: "The security suite passes", value: (r) => r.sec },
      { label: "All three", tip: "Scenarios solved at function, file, and repository granularity", value: (r) => r.scenarioJoint },
    ],
  },
  granularity: {
    name: "By granularity",
    cols: [
      { label: "Function", tip: "Func∧Sec on function-granularity tasks", value: (r) => r.tiers.function, main: true },
      { label: "File", tip: "Func∧Sec on file-granularity tasks", value: (r) => r.tiers.file, main: true },
      { label: "Repository", tip: "Func∧Sec on repository-granularity tasks", value: (r) => r.tiers.repo, main: true },
      { label: "All three", tip: "Scenarios solved at all three granularities", value: (r) => r.scenarioJoint },
    ],
  },
};

function Metric({ value, main }: { value: number; main?: boolean }) {
  return (
    <div className="lb2-metric">
      <span className={`lb2-val ${main ? "main" : ""}`}>
        {value.toFixed(1)}
        <small>%</small>
      </span>
      <span className="lb2-track">
        <span className={`lb2-fill ${main ? "main" : ""}`} style={{ width: `${value}%` }} />
      </span>
    </div>
  );
}

export default function Leaderboard({ rows, nTasks, nScenarios }: { rows: LbRow[]; nTasks: number; nScenarios: number }) {
  const [view, setView] = useState<keyof typeof VIEWS>("overall");
  const cols = VIEWS[view].cols;

  return (
    <section id="leaderboard" className="section band">
      <div className="container-page">
        <Reveal>
          <div className="lb2-head">
            <div>
              <p className="section-kicker">Leaderboard</p>
              <h2 className="lb2-title">Secure code is still rare</h2>
              <p className="lb2-sub">
                Share of the {nTasks} tasks each model solves. Func∧Sec counts a task only when its functional suite and its
                security suite both pass.
              </p>
            </div>
            <div className="seg-toggle" role="group" aria-label="Leaderboard view">
              {(Object.keys(VIEWS) as (keyof typeof VIEWS)[]).map((k) => (
                <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)}>
                  {VIEWS[k].name}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal className="lb2-wrap" delay={100}>
          <table className="lb2">
            <thead>
              <tr>
                <th scope="col" className="lb2-rankh">#</th>
                <th scope="col">Model</th>
                {cols.map((c) => (
                  <th key={c.label} scope="col" title={c.tip}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.model}>
                  <td className={`lb2-rank ${i === 0 ? "top" : ""}`}>{String(i + 1).padStart(2, "0")}</td>
                  <td>
                    <span className="lb2-model">{r.model}</span>
                    <span className="lb2-agent">{r.agent}</span>
                  </td>
                  {cols.map((c) => (
                    <td key={c.label}>
                      <Metric value={c.value(r)} main={c.main} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <p className="lb2-foot">
          All three: share of the {nScenarios} scenarios solved at function, file, and repository granularity. Every model ran
          at its highest reasoning effort.{" "}
          <a href={withBase("/traces")}>Browse all {(rows.length * nTasks).toLocaleString("en-US")} runs →</a>
        </p>
      </div>
    </section>
  );
}
