"use client";

import Link from "next/link";
import { catalogUrl, tracePageHref } from "@/lib/traces";
import { Fragment, useEffect, useMemo, useState } from "react";
import type { CatalogEntry, Tier } from "@/lib/types";

type TierFilter = "all" | Tier;
type OutcomeFilter = "all" | "reward" | "func-failed" | "sec-failed";
type SortKey = "task" | "time" | "turns";
type GroupKey = "none" | "tier" | "outcome";

const TIERS: Tier[] = ["function", "file", "repo"];
const OUTCOMES: Exclude<OutcomeFilter, "all">[] = ["reward", "func-failed", "sec-failed"];

const TIER_COLOR: Record<string, string> = {
  function: "rgb(var(--fg-2))",
  file: "rgb(var(--fg-2))",
  repo: "rgb(var(--fg-2))",
};

function outcomeOf(e: CatalogEntry): Exclude<OutcomeFilter, "all"> {
  if (e.reward === 1) return "reward";
  if (!e.functional) return "func-failed";
  return "sec-failed";
}

const OUTCOME_LABEL: Record<OutcomeFilter, string> = {
  all: "All",
  reward: "Solved (F∧S)",
  "func-failed": "Func failed (F✗)",
  "sec-failed": "Vuln left (F✓ S✗)",
};

const OUTCOME_SHORT: Record<OutcomeFilter, string> = {
  all: "all",
  reward: "F∧S",
  "func-failed": "F✗",
  "sec-failed": "F✓S✗",
};

/* ---------------- matrix (tier × outcome, clickable → sets filters) -------- */

function Matrix({
  catalog,
  tier,
  outcome,
  onPick,
}: {
  catalog: CatalogEntry[];
  tier: TierFilter;
  outcome: OutcomeFilter;
  onPick: (t: TierFilter, o: OutcomeFilter) => void;
}) {
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of catalog) {
      const k = `${e.tier}|${outcomeOf(e)}`;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [catalog]);

  const max = Math.max(1, ...counts.values());

  return (
    <div className="font-mono text-xs">
      <div className="grid grid-cols-[5.5rem_repeat(3,1fr)] gap-1">
        <span />
        {OUTCOMES.map((o) => (
          <span key={o} className="pb-1 text-center text-[10px] uppercase tracking-wider text-zinc-500">
            {OUTCOME_SHORT[o]}
          </span>
        ))}
        {TIERS.map((t) => (
          <Fragment key={t}>
            <span className="flex items-center text-[10px] uppercase tracking-wider" style={{ color: TIER_COLOR[t] }}>
              {t}
            </span>
            {OUTCOMES.map((o) => {
              const n = counts.get(`${t}|${o}`) || 0;
              const active = tier === t && outcome === o;
              return (
                <button
                  key={`${t}|${o}`}
                  onClick={() => onPick(active ? "all" : t, active ? "all" : o)}
                  className={`rounded border px-2 py-2 text-center transition-colors ${
                    active
                      ? "border-acc/60 bg-acc/15 text-acc"
                      : "border-line/70 text-zinc-300 hover:border-acc/40 hover:text-acc"
                  }`}
                  style={!active && n > 0 ? { background: `color-mix(in srgb, var(--color-acc) ${Math.round((n / max) * 14)}%, transparent)` } : undefined}
                  data-tip={`${t} · ${OUTCOME_LABEL[o]}: ${n} runs — click to filter`}
                >
                  {n || "·"}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-zinc-600">tier × outcome — click a cell to filter, again to clear</p>
    </div>
  );
}

/* ---------------- main browser -------------------------------------------- */

export default function TracesBrowser() {
  const [catalog, setCatalog] = useState<CatalogEntry[] | null>(null);
  const [model, setModel] = useState<string>("all");
  const [tier, setTier] = useState<TierFilter>("all");
  const [outcome, setOutcome] = useState<OutcomeFilter>("all");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("task");
  const [groupKey, setGroupKey] = useState<GroupKey>("tier");

  useEffect(() => {
    fetch(catalogUrl)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, []);

  const models = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of catalog || []) m.set(e.model || "?", (m.get(e.model || "?") || 0) + 1);
    return [...m.keys()];
  }, [catalog]);

  const stats = useMemo(() => {
    const xs = catalog || [];
    let reward = 0, funcFailed = 0, secFailed = 0;
    for (const e of xs) {
      const o = outcomeOf(e);
      if (o === "reward") reward++;
      else if (o === "func-failed") funcFailed++;
      else secFailed++;
    }
    return { total: xs.length, reward, funcFailed, secFailed, agents: models.length };
  }, [catalog, models]);

  const filtered = useMemo(() => {
    const xs = (catalog || []).filter((e) =>
      (model === "all" || (e.model || "?") === model) &&
      (tier === "all" || e.tier === tier) &&
      (outcome === "all" || outcomeOf(e) === outcome) &&
      (!q || e.task.toLowerCase().includes(q.toLowerCase()))
    );
    return [...xs].sort((a, b) => {
      if (sortKey === "time") return (b.time_min || 0) - (a.time_min || 0);
      if (sortKey === "turns") return (b.n_turns || 0) - (a.n_turns || 0);
      return a.task.localeCompare(b.task);
    });
  }, [catalog, model, tier, outcome, q, sortKey]);

  const groups = useMemo(() => {
    if (groupKey === "none") return [["", filtered] as [string, CatalogEntry[]]];
    const keyOf = (e: CatalogEntry) =>
      groupKey === "tier" ? (e.tier || "?")
        : OUTCOME_LABEL[outcomeOf(e)];
    const m = new Map<string, CatalogEntry[]>();
    for (const e of filtered) {
      const k = keyOf(e);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return [...m.entries()];
  }, [filtered, groupKey]);

  const pill = (active: boolean) => `pill ${active ? "pill-active" : ""}`;
  const hasFilter = model !== "all" || tier !== "all" || outcome !== "all" || q !== "";
  const clearFilters = () => {
    setModel("all"); setTier("all"); setOutcome("all"); setQ("");
  };

  const statItem = (v: number | string, label: string, cls = "text-zinc-100") => (
    <div className="px-4 py-3">
      <div className={`font-mono text-xl font-bold ${cls}`}>{v}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
    </div>
  );

  return (
    <div>
      {/* page head: stats + matrix (PTB-style) */}
      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <div className="card !p-0">
          <div className="grid grid-cols-2 divide-x divide-line/60 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
            {statItem(catalog == null ? "…" : stats.total, "runs")}
            {statItem(stats.reward, "solved (F∧S)", "text-acc")}
            {statItem(stats.funcFailed, "func failed (F✗)")}
            {statItem(stats.secFailed, "vuln left (F✓S✗)")}
            {statItem(stats.agents, "models")}
            {statItem(
              stats.total ? `${((stats.reward / stats.total) * 100).toFixed(0)}%` : "—",
              "solve rate",
              "text-acc",
            )}
          </div>
        </div>
        <div className="card">
          {catalog == null ? (
            <p className="font-mono text-xs text-zinc-600">loading…</p>
          ) : (
            <Matrix catalog={catalog} tier={tier} outcome={outcome} onPick={(t, o) => { setTier(t); setOutcome(o); }} />
          )}
        </div>
      </div>

      {/* filters */}
      <div className="mt-6 space-y-3">
        {models.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 font-mono text-xs text-zinc-500">Model:</span>
            <button className={pill(model === "all")} onClick={() => setModel("all")}>all</button>
            {models.map((m) => (
              <button key={m} className={pill(model === m)} onClick={() => setModel(m)}>{m}</button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 font-mono text-xs text-zinc-500">Tier:</span>
          {(["all", "function", "file", "repo"] as const).map((t) => (
            <button key={t} className={pill(tier === t)} onClick={() => setTier(t)}>{t}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 font-mono text-xs text-zinc-500">Outcome:</span>
          {(["all", "reward", "func-failed", "sec-failed"] as const).map((o) => (
            <button key={o} className={pill(outcome === o)} onClick={() => setOutcome(o)}>{OUTCOME_LABEL[o]}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 font-mono text-xs text-zinc-500">Filter:</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="task name …"
            className="rounded-full border border-line bg-transparent px-3.5 py-1.5 font-mono text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-acc/50"
          />
          <span className="font-mono text-xs text-zinc-500">Group:</span>
          {(["tier", "outcome", "none"] as const).map((g) => (
            <button key={g} className={pill(groupKey === g)} onClick={() => setGroupKey(g)}>
              {g === "none" ? "flat" : `by ${g}`}
            </button>
          ))}
          <span className="font-mono text-xs text-zinc-500">Sort:</span>
          {(["task", "time", "turns"] as const).map((s) => (
            <button key={s} className={pill(sortKey === s)} onClick={() => setSortKey(s)}>
              {s === "task" ? "name" : s}
            </button>
          ))}
          <span className="ml-auto font-mono text-xs text-zinc-600">
            {catalog == null ? "loading…" : `${filtered.length} / ${catalog.length} runs`}
            {hasFilter && (
              <button className="subrow-toggle ml-3" onClick={clearFilters}>clear filters</button>
            )}
          </span>
        </div>
      </div>

      {/* run list */}
      <div className="card mt-6 overflow-hidden !p-0">
        <div className="max-h-[46rem] overflow-auto">
          {catalog != null && filtered.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-xs text-zinc-600">no runs match the current filters</p>
              <button className="subrow-toggle mt-2" onClick={clearFilters}>clear filters</button>
            </div>
          )}
          {groups.map(([g, xs]) => (
            <div key={g || "__flat"}>
              {g && (
                <div className="sticky top-0 border-b border-line/60 bg-panel/95 px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 backdrop-blur">
                  {g} <span className="text-zinc-700">({xs.length})</span>
                </div>
              )}
              {xs.map((e) => (
                <Link
                  key={`${e.traj_key}/${e.task}`}
                  href={tracePageHref(e.traj_key, e.task)}
                  className="row-hover flex w-full flex-wrap items-center gap-x-3 gap-y-1 border-b border-line/40 px-4 py-2.5 text-left last:border-0"
                >
                  <span className="font-mono text-xs">
                    <span className={e.functional ? "text-acc" : "text-zinc-600"}>F{e.functional ? "✓" : "✗"}</span>
                    <span className={`ml-1 ${e.secure ? "text-acc" : "text-zinc-600"}`}>S{e.secure ? "✓" : "✗"}</span>
                  </span>
                  <span className="font-mono text-sm text-zinc-200">{e.task}</span>
                  {e.tier && (
                    <span
                      className="rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                      style={{ color: TIER_COLOR[e.tier], borderColor: `color-mix(in srgb, ${TIER_COLOR[e.tier]} 35%, transparent)` }}
                    >
                      {e.tier}
                    </span>
                  )}
                  {e.exit_reason && (
                    <span className="chip-warn rounded px-1.5 py-0.5 font-mono text-[10px]">
                      {e.exit_reason}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-xs text-zinc-500">
                    {e.time_min != null && `${e.time_min.toFixed(1)} min`}
                    {e.time_min != null && e.n_turns != null && " · "}
                    {e.n_turns != null && `${e.n_turns} turns`}
                  </span>
                  <span className="subrow-toggle">view →</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
