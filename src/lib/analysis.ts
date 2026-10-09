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

/** One stable color per model, by leaderboard position (CSS variables --m1..--m6). */
export const modelColor = (model: string) => `rgb(var(--m${ROWS.findIndex((r) => r.model === model) + 1}))`;

export const pct = (n: number, d: number) => (d ? (100 * n) / d : 0);
export const fmt = (x: number) => x.toFixed(1);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const count = <T,>(xs: T[], f: (x: T) => boolean) => xs.reduce((n, x) => n + (f(x) ? 1 : 0), 0);

export function joinNames(xs: string[]): string {
  if (xs.length <= 1) return xs.join("");
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`;
}

/** Hue for a Func∧Sec rate: coral red at 0%, emerald at 40% and above. */
export const rateHue = (rate: number) => Math.round(4 + Math.max(0, Math.min(1, rate / 40)) * 154);

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

// ---------------------------------------------------------------- weaknesses

export type WeaknessStat = Weakness & { scenarios: number; joint: number; func: number };

export function weaknessStats(): WeaknessStat[] {
  return wk.weaknesses.map((w) => {
    const tasks = ROWS.flatMap((r) => r.tasks.filter((t) => meta[t.id]?.cwe === w.cwe));
    const scenarios = new Set(Object.values(meta).filter((m) => m.cwe === w.cwe).map((m) => m.scenario)).size;
    return { ...w, scenarios, joint: pct(count(tasks, (t) => t.solved), tasks.length), func: pct(count(tasks, (t) => t.functional), tasks.length) };
  });
}

export type Group = { code: string; name: string; items: WeaknessStat[]; scenarios: number; joint: number; perModel: { model: string; rate: number }[] };

/** OWASP Top 10:2025 categories present in the benchmark, then the CWEs outside the Top 10. */
export function owaspGroups(): Group[] {
  const ws = weaknessStats();
  const defs = Object.keys(wk.owasp_categories).sort().map((code) => ({ code, name: wk.owasp_categories[code], items: ws.filter((w) => w.owasp === code) }));
  defs.push({ code: "", name: "Outside the OWASP Top 10", items: ws.filter((w) => !w.owasp) });
  return defs
    .filter((g) => g.items.length)
    .map((g) => {
      const cwes = new Set(g.items.map((w) => w.cwe));
      const perModel = ROWS.map((r) => {
        const ts = r.tasks.filter((t) => cwes.has(meta[t.id]?.cwe));
        return { model: r.model, rate: pct(count(ts, (t) => t.solved), ts.length) };
      });
      const all = ROWS.flatMap((r) => r.tasks.filter((t) => cwes.has(meta[t.id]?.cwe)));
      return { ...g, items: [...g.items].sort((a, b) => b.scenarios - a.scenarios), scenarios: g.items.reduce((s, w) => s + w.scenarios, 0), joint: pct(count(all, (t) => t.solved), all.length), perModel };
    });
}

// ---------------------------------------------------------------- circle packing

export type Circle = { x: number; y: number; r: number };

function tangentTo(a: Circle, b: Circle, r: number, pad: number): Circle[] {
  const da = a.r + r + pad, db = b.r + r + pad;
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
  if (d === 0 || d > da + db || d < Math.abs(da - db)) return [];
  const l = (da * da - db * db + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, da * da - l * l));
  const mx = a.x + (l * dx) / d, my = a.y + (l * dy) / d;
  return [{ x: mx + (h * dy) / d, y: my - (h * dx) / d, r }, { x: mx - (h * dy) / d, y: my + (h * dx) / d, r }];
}

const fits = (c: Circle, placed: Circle[], pad: number) => placed.every((p) => Math.hypot(c.x - p.x, c.y - p.y) >= p.r + c.r + pad - 1e-6);

/** Deterministic front-chain style packing for a handful of circles; returns circles centred on (0, 0). */
export function packCircles(radii: number[], pad = 4): { circles: Circle[]; w: number; h: number } {
  const order = radii.map((r, i) => ({ r, i })).sort((a, b) => b.r - a.r || a.i - b.i);
  const placed: (Circle & { i: number })[] = [];
  for (const { r, i } of order) {
    if (placed.length === 0) { placed.push({ x: 0, y: 0, r, i }); continue; }
    if (placed.length === 1) { placed.push({ x: placed[0].r + r + pad, y: 0, r, i }); continue; }
    let best: Circle | null = null, bestD = Infinity;
    for (let a = 0; a < placed.length; a++)
      for (let b = a + 1; b < placed.length; b++)
        for (const c of tangentTo(placed[a], placed[b], r, pad)) {
          if (!fits(c, placed, pad)) continue;
          const d = Math.hypot(c.x, c.y);
          if (d < bestD) { bestD = d; best = c; }
        }
    if (!best) {
      const p = placed[0];
      for (let k = 0; k < 72 && !best; k++) {
        const ang = (k * Math.PI) / 36, c = { x: p.x + Math.cos(ang) * (p.r + r + pad), y: p.y + Math.sin(ang) * (p.r + r + pad), r };
        if (fits(c, placed, pad)) best = c;
      }
    }
    placed.push({ ...(best ?? { x: 0, y: 0, r }), i });
  }
  const minX = Math.min(...placed.map((p) => p.x - p.r)), maxX = Math.max(...placed.map((p) => p.x + p.r));
  const minY = Math.min(...placed.map((p) => p.y - p.r)), maxY = Math.max(...placed.map((p) => p.y + p.r));
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const circles: Circle[] = new Array(radii.length);
  for (const p of placed) circles[p.i] = { x: p.x - cx, y: p.y - cy, r: p.r };
  return { circles, w: maxX - minX, h: maxY - minY };
}
