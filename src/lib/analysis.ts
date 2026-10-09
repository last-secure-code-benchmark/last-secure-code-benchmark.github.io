// Numbers behind the leaderboard, the scroll story, and the analysis figures.
// Everything is computed at build time from src/data, which holds the same
// merged per-task results as the paper's main table.
import lbRaw from "@/data/leaderboard.json";
import metaRaw from "@/data/tasks.json";
import wkRaw from "@/data/weaknesses.json";

export type Tier = "function" | "file" | "repo";
export const TIERS: Tier[] = ["function", "file", "repo"];
export const TIER_LABEL: Record<Tier, string> = { function: "Function", file: "File", repo: "Repository" };

type Task = { id: string; tier: string; solved: boolean; functional: boolean; secure: boolean; verdict?: boolean };
export type Row = { model: string; agent: string; traj_key?: string; on_target?: number; tasks: Task[] };
type Meta = Record<string, { scenario: string; tier: Tier; language: string; cwe: string }>;
type Weakness = { cwe: string; name: string; family: string; owasp: string | null };

const meta = metaRaw as Meta;
const wk = wkRaw as { owasp_categories: Record<string, string>; weaknesses: Weakness[] };

/** Models in leaderboard order: most tasks solved functionally and securely first. */
export const ROWS: Row[] = [...(lbRaw.results as unknown as Row[])].sort(
  (a, b) => (b.on_target ?? 0) - (a.on_target ?? 0),
);
export const N_TASKS = ROWS[0]?.tasks.length ?? 450;
export const N_SCENARIOS = new Set(Object.values(meta).map((m) => m.scenario)).size;
export const N_LANGUAGES = new Set(Object.values(meta).map((m) => m.language)).size;
export const N_CWES = new Set(Object.values(meta).map((m) => m.cwe)).size;


export const pct = (n: number, d: number) => (d ? (100 * n) / d : 0);
export const fmt = (x: number) => x.toFixed(1);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const count = <T,>(xs: T[], f: (x: T) => boolean) => xs.reduce((n, x) => n + (f(x) ? 1 : 0), 0);

export function joinNames(xs: string[]): string {
  if (xs.length <= 1) return xs.join("");
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`;
}


// ---------------------------------------------------------------- leaderboard

export type Score = { func: number; sec: number; joint: number; scenarioJoint: number; tiers: Record<Tier, number> };

export function score(r: Row): Score {
  const n = r.tasks.length;
  const byScenario = new Map<string, boolean[]>();
  for (const t of r.tasks) {
    const s = meta[t.id]?.scenario ?? t.id.replace(/_(function|file|repo)$/, "");
    byScenario.set(s, [...(byScenario.get(s) ?? []), t.solved]);
  }
  const tiers = Object.fromEntries(
    TIERS.map((tier) => {
      const ts = r.tasks.filter((t) => t.tier === tier);
      return [tier, pct(count(ts, (t) => t.solved), ts.length)];
    }),
  ) as Record<Tier, number>;
  return {
    func: pct(count(r.tasks, (t) => t.functional), n),
    sec: pct(count(r.tasks, (t) => t.secure), n),
    joint: pct(count(r.tasks, (t) => t.solved), n),
    scenarioJoint: pct(count([...byScenario.values()], (v) => v.every(Boolean)), byScenario.size),
    tiers,
  };
}

// ---------------------------------------------------------------- outcomes

export type Outcome = { model: string; agent: string; n: number; both: number; funcOnly: number; secOnly: number; neither: number; noVerdict: number };

export function outcomes(): Outcome[] {
  return ROWS.map((r) => {
    const o = { model: r.model, agent: r.agent, n: r.tasks.length, both: 0, funcOnly: 0, secOnly: 0, neither: 0, noVerdict: 0 };
    for (const t of r.tasks) {
      if (t.verdict === false) o.noVerdict++;
      else if (t.functional && t.secure) o.both++;
      else if (t.functional) o.funcOnly++;
      else if (t.secure) o.secOnly++;
      else o.neither++;
    }
    return o;
  });
}

// ---------------------------------------------------------------- granularity

export function granularity() {
  const per = ROWS.map((r) => ({
    model: r.model,
    points: TIERS.map((tier) => {
      const ts = r.tasks.filter((t) => t.tier === tier);
      return { tier, func: pct(count(ts, (t) => t.functional), ts.length), joint: pct(count(ts, (t) => t.solved), ts.length) };
    }),
  }));
  const avg = TIERS.map((tier, i) => ({ tier, func: mean(per.map((p) => p.points[i].func)), joint: mean(per.map((p) => p.points[i].joint)) }));
  return { per, avg };
}

// ---------------------------------------------------------------- languages

const LANG_LABEL: Record<string, string> = { java: "Java", c: "C", cpp: "C++", javascript: "JavaScript", python: "Python", php: "PHP", go: "Go" };

export function byLanguage() {
  return Object.keys(LANG_LABEL)
    .map((lang) => {
      const perModel = ROWS.map((r) => {
        const ts = r.tasks.filter((t) => meta[t.id]?.language === lang);
        return { model: r.model, rate: pct(count(ts, (t) => t.solved), ts.length) };
      });
      const scenarios = new Set(Object.values(meta).filter((m) => m.language === lang).map((m) => m.scenario)).size;
      return { lang, label: LANG_LABEL[lang], scenarios, mean: mean(perModel.map((p) => p.rate)), perModel };
    })
    .filter((l) => l.scenarios > 0)
    .sort((a, b) => b.mean - a.mean);
}

// ---------------------------------------------------------------- weakness families

/** The paper's eight CWE families: how often the code works, and how much of that working code is secure. */
export function families() {
  const famOf = new Map(wk.weaknesses.map((w) => [w.cwe, w.family]));
  const order = [...new Set(wk.weaknesses.map((w) => w.family))];
  return order
    .map((family) => {
      const cwes = wk.weaknesses.filter((w) => w.family === family).map((w) => w.cwe);
      const tasks = ROWS.flatMap((r) => r.tasks.filter((t) => famOf.get(meta[t.id]?.cwe) === family));
      const func = count(tasks, (t) => t.functional), joint = count(tasks, (t) => t.solved);
      const scenarios = new Set(Object.values(meta).filter((m) => famOf.get(m.cwe) === family).map((m) => m.scenario)).size;
      return { family, cwes, scenarios, func: pct(func, tasks.length), joint: pct(joint, tasks.length), secureShare: pct(joint, func) };
    })
    .sort((a, b) => b.joint - a.joint);
}

// ---------------------------------------------------------------- languages, pooled over models

export function languageOutcomes() {
  return byLanguage()
    .map((l) => {
      const tasks = ROWS.flatMap((r) => r.tasks.filter((t) => meta[t.id]?.language === l.lang));
      const n = tasks.length;
      const both = count(tasks, (t) => t.solved), funcOnly = count(tasks, (t) => t.functional && !t.secure);
      return { lang: l.lang, label: l.label, scenarios: l.scenarios, both: pct(both, n), funcOnly: pct(funcOnly, n), rest: pct(n - both - funcOnly, n) };
    })
    .sort((a, b) => b.both - a.both);
}

// ---------------------------------------------------------------- every scenario × every model

export function scenarioGrid() {
  const ids = [...new Set(Object.values(meta).map((m) => m.scenario))];
  const info = new Map(Object.values(meta).map((m) => [m.scenario, { language: LANG_LABEL[m.language] ?? m.language, cwe: m.cwe }]));
  const solved = new Map<string, number[]>(ids.map((s) => [s, ROWS.map(() => 0)]));
  ROWS.forEach((r, mi) => {
    for (const t of r.tasks) {
      const s = meta[t.id]?.scenario;
      if (s && t.solved) solved.get(s)![mi] += 1;
    }
  });
  const scenarios = ids
    .map((id) => ({ id, ...info.get(id)!, counts: solved.get(id)!, total: solved.get(id)!.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total || a.id.localeCompare(b.id));
  return {
    models: ROWS.map((r) => r.model),
    scenarios,
    never: scenarios.filter((s) => s.total === 0).length,
    everyModel: scenarios.filter((s) => s.counts.every((c) => c > 0)).length,
  };
}
