"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { TaskTrajectory, TrajTurn } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* turn-level trajectory viewer + verifier + files                     */
/* ------------------------------------------------------------------ */

const ROLE_STYLE: Record<TrajTurn["role"], { label: string; chip: string }> = {
  user: { label: "User", chip: "role-chip chip-user" },
  assistant: { label: "Assistant", chip: "role-chip chip-assistant" },
  tool: { label: "Tool", chip: "role-chip chip-tool" },
  system: { label: "System", chip: "role-chip chip-system" },
};

const firstLine = (s: string, n: number) => {
  const line = s.split("\n").find((l) => l.trim()) || "";
  return line.length > n ? line.slice(0, n) + " …" : line;
};

/** 单行 turn 摘要：折叠时看到的那行 */
function turnSummary(t: TrajTurn): ReactNode {
  if (t.role === "assistant") {
    const parts: string[] = [];
    if (t.reasoning) parts.push("reasoning");
    for (const c of t.tool_calls || []) parts.push(c.name);
    return <span className="text-zinc-400">{parts.length ? parts.join(" · ") : "(empty turn)"}</span>;
  }
  if (t.role === "tool") {
    return (
      <span className="text-zinc-500">
        <span className="text-zinc-600">← {t.tool_call_id || "tool"}</span>
        {t.output ? ` · ${firstLine(t.output, 90)}` : ""}
      </span>
    );
  }
  return <span className="text-zinc-500">{firstLine(t.content || "", 110)}</span>;
}

/** 展开的 turn 完整内容：始终深色终端块（PTB tool-bash 式） */
function TurnDetail({ t }: { t: TrajTurn }) {
  if (t.role === "assistant") {
    return (
      <div className="dark-pane mt-2 space-y-2 rounded border border-line/70 bg-[#0d1526] p-2.5">
        {t.reasoning && (
          <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-zinc-400">
            {t.reasoning}
          </p>
        )}
        {(t.tool_calls || []).map((c, i) => (
          <div key={i} className="overflow-hidden rounded border border-line/70 bg-black/40">
            <div className="border-b border-line/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-acc">
              $ {c.name}
              <span className="ml-2 normal-case tracking-normal text-zinc-600">{c.id}</span>
            </div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all px-3 py-2 font-mono text-xs leading-relaxed text-zinc-300">
              {c.args || "(no args)"}
            </pre>
          </div>
        ))}
      </div>
    );
  }
  const body = t.role === "tool" ? t.output : t.content;
  return (
    <pre className="dark-pane mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded border border-line/70 bg-[#0d1526] px-3 py-2 font-mono text-xs leading-relaxed text-zinc-400">
      {body || "(empty)"}
    </pre>
  );
}

function TurnRow({ turn, open, onToggle }: { turn: TrajTurn; open: boolean; onToggle: () => void }) {
  const st = ROLE_STYLE[turn.role] || ROLE_STYLE.system;
  return (
    <div id={`turn-${turn.n}`} className="scroll-mt-24 border-b border-line/30 last:border-0">
      <button
        className="row-hover flex w-full items-baseline gap-x-3 px-3 py-1.5 text-left"
        onClick={onToggle}
      >
        <span className="w-7 shrink-0 text-right font-mono text-[10px] text-zinc-600">{turn.n}</span>
        <span className={`shrink-0 rounded border px-1.5 py-px font-mono text-[10px] ${st.chip}`}>
          {st.label}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs">{turnSummary(turn)}</span>
        <span className="shrink-0 font-mono text-[10px] text-zinc-700">{open ? "[-]" : "[+]"}</span>
      </button>
      {open && <div className="px-3 pb-3 pl-12"><TurnDetail t={turn} /></div>}
    </div>
  );
}

/* ---------------- verifier ---------------- */

/** verifier 日志按行着色：功能测试绿、漏洞测试红、分隔线灰 */
function logLineCls(l: string): string {
  if (/test_func\.py|VSB_BUILD=pass|PASSED| passed/.test(l)) return "text-emerald-300/90";
  if (/test_vuln\.py|FAILED| failed|Error/i.test(l)) return "font-semibold text-zinc-100";
  if (/^=+|^-+/.test(l)) return "text-zinc-600";
  if (/^\[eval\]|^\[start\]/.test(l)) return "text-zinc-500";
  return "text-zinc-400";
}

function VerdictChip({ label, v }: { label: string; v?: number }) {
  const cls = v == null ? "chip-na" : v === 1 ? "chip-ok" : "chip-bad";
  return (
    <span className={`rounded px-2 py-0.5 font-mono text-xs ${cls}`}>
      {label} {v == null ? "—" : v === 1 ? "✓" : "✗"}
    </span>
  );
}

function VerifierView({ detail }: { detail: TaskTrajectory }) {
  const v = detail.verdict || {};
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <VerdictChip label="functional" v={v.functional} />
        <VerdictChip label="secure" v={v.secure} />
        <VerdictChip label="reward" v={v.reward} />
        <span className="ml-auto font-mono text-[10px] text-zinc-600">verifier/reward.json + test-stdout.txt</span>
      </div>
      {detail.stdout ? (
        <pre className="dark-pane max-h-[30rem] overflow-auto whitespace-pre-wrap break-all border-t border-line/50 bg-[#0d1526] px-3 py-2 font-mono text-[11px] leading-relaxed">
          {detail.stdout.split("\n").map((l, i) => (
            <span key={i} className={`${logLineCls(l)} block`}>{l || " "}</span>
          ))}
        </pre>
      ) : (
        <p className="border-t border-line/50 px-3 py-3 font-mono text-xs text-zinc-600">no verifier log captured</p>
      )}
    </div>
  );
}

/* ---------------- files（左树右内容，PTB workspace 式） ---------------- */

function FilesView({ files }: { files: Record<string, string | null> }) {
  const paths = Object.keys(files);
  const [sel, setSel] = useState<string | null>(paths[0] ?? null);
  if (paths.length === 0) {
    return <p className="px-3 py-3 font-mono text-xs text-zinc-600">no workspace artifacts captured</p>;
  }
  return (
    <div className="grid sm:grid-cols-[13rem_1fr]">
      <div className="max-h-[30rem] overflow-auto border-b border-line/60 py-1 sm:border-b-0 sm:border-r">
        {paths.map((p) => (
          <button
            key={p}
            onClick={() => setSel(p)}
            className={`row-hover flex w-full items-baseline gap-2 px-3 py-1.5 text-left font-mono text-xs ${
              sel === p ? "bg-acc/10 text-acc" : "text-zinc-300"
            }`}
          >
            <span className="min-w-0 flex-1 truncate">{p}</span>
            {files[p] == null && <span className="shrink-0 text-[10px] text-zinc-600">bin</span>}
          </button>
        ))}
      </div>
      <div className="dark-pane max-h-[30rem] overflow-auto bg-[#0d1526]">
        {sel == null ? (
          <p className="px-3 py-3 font-mono text-xs text-zinc-600">pick a file</p>
        ) : files[sel] == null ? (
          <p className="px-3 py-3 font-mono text-xs text-zinc-600">{sel}: binary / too large — not inlined</p>
        ) : (
          <pre className="whitespace-pre-wrap break-all px-3 py-2 font-mono text-xs leading-relaxed text-zinc-400">
            {files[sel]}
          </pre>
        )}
      </div>
    </div>
  );
}

/* ---------------- tabbed detail（带工具栏） ---------------- */

export default function TaskDetailView({ taskId, detail }: { taskId: string; detail: TaskTrajectory }) {
  const nFiles = detail.files ? Object.keys(detail.files).length : 0;
  const hasVerifier = !!detail.verdict || !!detail.stdout;
  const tabs = [
    { key: "turns" as const, label: `Turns (${detail.turns.length})` },
    { key: "verifier" as const, label: "Verifier", disabled: !hasVerifier },
    { key: "files" as const, label: `Files (${nFiles})`, disabled: nFiles === 0 },
  ];
  const [tab, setTab] = useState<"turns" | "verifier" | "files">("turns");

  /* turns 工具栏状态：focus 隐藏 system turn；openSet 控制展开 */
  const [showSystem, setShowSystem] = useState(false);
  const [openSet, setOpenSet] = useState<ReadonlySet<number>>(new Set());
  const [jump, setJump] = useState("");

  const visibleTurns = useMemo(
    () => detail.turns.filter((t) => showSystem || t.role !== "system"),
    [detail.turns, showSystem],
  );
  const nToolCalls = useMemo(
    () => detail.turns.reduce((acc, t) => acc + (t.tool_calls?.length || 0), 0),
    [detail.turns],
  );
  const allOpen = visibleTurns.length > 0 && visibleTurns.every((t) => openSet.has(t.n));

  const toggleTurn = (n: number) => {
    const s = new Set(openSet);
    if (s.has(n)) s.delete(n);
    else s.add(n);
    setOpenSet(s);
  };

  const jumpTo = () => {
    const n = parseInt(jump, 10);
    if (Number.isNaN(n)) return;
    if (!showSystem && detail.turns.find((t) => t.n === n)?.role === "system") setShowSystem(true);
    setOpenSet(new Set(openSet).add(n));
    requestAnimationFrame(() => {
      document.getElementById(`turn-${n}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="tv-head">
        <span className="truncate font-mono text-[11px] text-zinc-500">{taskId}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              disabled={t.disabled}
              onClick={() => setTab(t.key)}
              className={`rounded px-2 py-0.5 font-mono text-[11px] ${
                t.disabled
                  ? "cursor-not-allowed text-zinc-700"
                  : tab === t.key
                    ? "bg-acc/10 text-acc"
                    : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </span>
      </div>

      {tab === "turns" && (
        <>
          {/* 工具栏：计数 · focus/full · 跳转 · 展开全部 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line/60 px-3 py-2 font-mono text-[11px] text-zinc-500">
            <span>{visibleTurns.length} turns · {nToolCalls} tool calls</span>
            <span className="ml-auto" />
            <span className="flex overflow-hidden rounded border border-line">
              {([["focus", "Focus"], ["full", "Full"]] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setShowSystem(mode === "full")}
                  className={`px-2 py-0.5 ${
                    (mode === "full") === showSystem ? "bg-acc/10 text-acc" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-zinc-600">→</span>
              <input
                value={jump}
                onChange={(e) => setJump(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && jumpTo()}
                placeholder="turn #"
                className="w-16 rounded border border-line bg-transparent px-1.5 py-0.5 text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-acc/50"
              />
            </span>
            <button
              className="subrow-toggle"
              onClick={() => setOpenSet(allOpen ? new Set() : new Set(visibleTurns.map((t) => t.n)))}
            >
              {allOpen ? "collapse all" : "expand all"}
            </button>
          </div>
          <div className="max-h-[42rem] overflow-auto py-1">
            {visibleTurns.length === 0 && (
              <p className="px-3 py-3 font-mono text-xs text-zinc-600">no trajectory recorded for this task</p>
            )}
            {visibleTurns.map((t) => (
              <TurnRow key={t.n} turn={t} open={openSet.has(t.n)} onToggle={() => toggleTurn(t.n)} />
            ))}
          </div>
        </>
      )}
      {tab === "verifier" && <VerifierView detail={detail} />}
      {tab === "files" && detail.files && <FilesView files={detail.files} />}
    </div>
  );
}
