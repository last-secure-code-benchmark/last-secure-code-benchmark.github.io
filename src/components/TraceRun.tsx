"use client";

import { useEffect, useMemo, useState } from "react";
import { withBase } from "@/lib/base";
import TaskDetailView from "@/components/TaskDetail";
import type { CatalogEntry, TaskTrajectory } from "@/lib/types";
import { catalogUrl, traceUrl } from "@/lib/traces";

const TIER_COLOR: Record<string, string> = {
  function: "rgb(var(--fg-2))",
  file: "rgb(var(--fg-2))",
  repo: "rgb(var(--fg-2))",
};

function VerdictChip({ label, v }: { label: string; v?: number }) {
  const cls = v == null ? "chip-na" : v === 1 ? "chip-ok" : "chip-bad";
  return (
    <span className={`rounded px-2 py-1 text-center font-mono text-xs ${cls}`}>
      {label} {v == null ? "—" : v === 1 ? "✓" : "✗"}
    </span>
  );
}

export default function TraceRun({ trajKey, task }: { trajKey: string; task: string }) {
  const [detail, setDetail] = useState<TaskTrajectory | null>(null);
  const [entry, setEntry] = useState<CatalogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const jsonUrl = useMemo(
    () => traceUrl(trajKey, task),
    [trajKey, task],
  );

  useEffect(() => {
    let dead = false;
    setLoading(true);
    fetch(catalogUrl)
      .then((r) => (r.ok ? r.json() : []))
      .then((c: CatalogEntry[]) => {
        if (!dead) setEntry(c.find((e) => e.traj_key === trajKey && e.task === task) || null);
      })
      .catch(() => {});
    fetch(jsonUrl)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => !dead && setDetail(d as TaskTrajectory))
      .catch(() => !dead && setDetail({ task, turns: [] }))
      .finally(() => !dead && setLoading(false));
    return () => {
      dead = true;
    };
  }, [trajKey, task, jsonUrl]);

  const v = detail?.verdict || {};
  const stats: [string, string][] = [
    ["tier", entry?.tier || "—"],
    ["time", entry?.time_min != null ? `${entry.time_min.toFixed(1)} min` : "—"],
    ["turns", entry?.n_turns != null ? String(entry.n_turns) : "—"],
    ["tool calls", entry?.llm_calls != null ? String(entry.llm_calls) : "—"],
    ["files", entry?.n_files != null ? String(entry.n_files) : "—"],
  ];
  if (entry?.exit_reason) stats.push(["exit", entry.exit_reason]);

  return (
    <section className="section">
      <div className="container-page">
        <a href={withBase("/traces")} className="subrow-toggle">← all traces</a>

        <div className="mt-4 grid gap-6 lg:grid-cols-[17rem_1fr]">
          {/* 左栏：run 摘要卡（PTB summary rail） */}
          <aside>
            <div className="card lg:sticky lg:top-20">
              <h1 className="break-all font-mono text-sm font-semibold text-zinc-100">{task}</h1>
              <p className="mt-1 font-mono text-xs text-zinc-500">
                {entry ? `${entry.model} / ${entry.agent}` : trajKey}
              </p>
              {entry?.tier && (
                <span
                  className="mt-2 inline-block rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                  style={{
                    color: TIER_COLOR[entry.tier],
                    borderColor: `color-mix(in srgb, ${TIER_COLOR[entry.tier]} 35%, transparent)`,
                  }}
                >
                  {entry.tier} tier
                </span>
              )}

              <div className="mt-4 grid grid-cols-3 gap-1.5">
                <VerdictChip label="F" v={v.functional} />
                <VerdictChip label="S" v={v.secure} />
                <VerdictChip label="reward" v={v.reward} />
              </div>

              <dl className="mt-4 border-t border-line/60 pt-3">
                {stats.map(([k, val]) => (
                  <div key={k} className="flex items-baseline justify-between py-0.5">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{k}</dt>
                    <dd className="font-mono text-xs text-zinc-300">{val}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex flex-col gap-2 border-t border-line/60 pt-3">
                <a href={jsonUrl} download={`${task}.json`} className="btn btn-ghost !px-3 !py-1.5 text-xs">
                  download trace (.json)
                </a>
                <button
                  className="subrow-toggle text-left"
                  onClick={() => {
                    navigator.clipboard?.writeText(`${trajKey}/${task}`).catch(() => {});
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }}
                >
                  {copied ? "copied ✓" : "copy run id"}
                </button>
              </div>
            </div>
          </aside>

          {/* 主栏：turns / verifier / files */}
          <div className="min-w-0">
            {loading ? (
              <p className="px-2 py-10 text-center font-mono text-xs text-zinc-600">loading trace …</p>
            ) : (
              detail && <TaskDetailView taskId={task} detail={detail} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
