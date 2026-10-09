import type { CSSProperties, ReactNode } from "react";
import Reveal from "@/components/Reveal";
import {
  ROWS,
  TIERS,
  TIER_LABEL,
  byLanguage,
  fmt,
  granularity,
  joinNames,
  modelColor,
  outcomes,
  owaspGroups,
  packCircles,
  pct,
  rateHue,
  type Outcome,
} from "@/lib/analysis";

function Figure({ kicker, title, sub, children }: { kicker: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <figure className="an-fig">
      <Reveal>
        <figcaption>
          <p className="an-kicker">{kicker}</p>
          <h3 className="an-title">{title}</h3>
          {sub && <p className="an-sub">{sub}</p>}
        </figcaption>
      </Reveal>
      <Reveal className="an-body" delay={120}>
        {children}
      </Reveal>
    </figure>
  );
}

const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties;

function ModelLegend() {
  return (
    <div className="an-legend">
      {ROWS.map((r) => (
        <span key={r.model}>
          <i style={{ background: modelColor(r.model), borderRadius: "50%" }} />
          {r.model}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- failure modes

const SEGMENTS: { key: keyof Outcome; label: string; cls: string }[] = [
  { key: "both", label: "Works and secure", cls: "fm-both" },
  { key: "funcOnly", label: "Works, still vulnerable", cls: "fm-vuln" },
  { key: "secOnly", label: "Secure, does not work", cls: "fm-sec" },
  { key: "neither", label: "Neither", cls: "fm-neither" },
  { key: "noVerdict", label: "No verdict", cls: "fm-nov" },
];

function FailureModes() {
  const os = outcomes();
  const total = os.reduce((s, o) => s + o.n, 0);
  const vulnerable = os.reduce((s, o) => s + o.funcOnly, 0);
  return (
    <Figure
      kicker="Failure modes"
      title={`${Math.round(pct(vulnerable, total))}% of all ${total.toLocaleString("en-US")} runs end with code that works but is still vulnerable`}
      sub="The functional suite checks the feature the task asks for. The security suite replays the original attack against the running program."
    >
      <div className="an-legend">
        {SEGMENTS.map((s) => (
          <span key={s.key}>
            <i className={s.cls} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="fm">
        {os.map((o, i) => (
          <div className="fm-row" key={o.model}>
            <div className="fm-name">
              {o.model}
              <span>{o.agent}</span>
            </div>
            <div className="fm-bar" style={{ transitionDelay: `${i * 90}ms` }}>
              {SEGMENTS.map((s) => {
                const n = o[s.key] as number;
                const v = pct(n, o.n);
                return v > 0 ? (
                  <span key={s.key} className={`fm-seg ${s.cls}`} style={{ width: `${v}%` }} title={`${s.label}: ${fmt(v)}% (${n} of ${o.n})`}>
                    {v >= 9 ? `${Math.round(v)}%` : ""}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    </Figure>
  );
}

// ---------------------------------------------------------------- granularity

function Granularity() {
  const { per, avg } = granularity();
  const W = 560, H = 300, L = 46, R = 150, T = 16, B = 34;
  const x = (i: number) => L + (i * (W - L - R)) / (TIERS.length - 1);
  const y = (v: number) => T + (1 - v / 100) * (H - T - B);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const joints = avg.map((a) => a.joint);
  const last = avg[avg.length - 1];
  return (
    <Figure
      kicker="By granularity"
      title="More context costs function, not security"
      sub={`From function to repository granularity, the average functional pass rate falls from ${Math.round(avg[0].func)}% to ${Math.round(last.func)}%, while Func∧Sec stays between ${Math.round(Math.min(...joints))}% and ${Math.round(Math.max(...joints))}%.`}
    >
      <svg className="gr" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Average functional and Func∧Sec pass rates by granularity">
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line className="gr-grid" x1={L} x2={x(TIERS.length - 1) + 12} y1={y(v)} y2={y(v)} />
            <text className="gr-tick" x={L - 10} y={y(v)}>{`${v}%`}</text>
          </g>
        ))}
        {TIERS.map((t, i) => (
          <text key={t} className="gr-x" x={x(i)} y={H - 10}>
            {TIER_LABEL[t]}
          </text>
        ))}
        {per.map((p) => (
          <path key={p.model} className="gr-line gr-model" d={path(p.points.map((q) => q.joint))} pathLength={1} style={{ stroke: modelColor(p.model) }} />
        ))}
        <path className="gr-line gr-func" d={path(avg.map((a) => a.func))} pathLength={1} />
        <path className="gr-line gr-joint" d={path(joints)} pathLength={1} />
        {avg.map((a, i) => (
          <g key={a.tier}>
            <circle className="gr-pt gr-func-pt" cx={x(i)} cy={y(a.func)} r={4} />
            <circle className="gr-pt gr-joint-pt" cx={x(i)} cy={y(a.joint)} r={4} />
          </g>
        ))}
        <text className="gr-end gr-func-t" x={x(TIERS.length - 1) + 14} y={y(last.func)}>{`Functional ${Math.round(last.func)}%`}</text>
        <text className="gr-end gr-joint-t" x={x(TIERS.length - 1) + 14} y={y(last.joint)}>{`Func∧Sec ${Math.round(last.joint)}%`}</text>
      </svg>
      <p className="an-note">Thick lines average the six models. Thin lines show each model&apos;s Func∧Sec.</p>
    </Figure>
  );
}

// ---------------------------------------------------------------- languages

function Languages() {
  const ls = byLanguage();
  const top = Math.max(...ls.flatMap((l) => l.perModel.map((p) => p.rate)));
  const max = Math.max(40, Math.ceil(top / 10) * 10);
  const ticks = Array.from({ length: max / 10 + 1 }, (_, i) => i * 10);
  const lead = ls.slice(0, 3).map((l) => l.label);
  const trail = ls.slice(-2).map((l) => l.label);
  return (
    <Figure
      kicker="By language"
      title={`${joinNames(lead)} lead; ${joinNames(trail)} trail`}
      sub="Func∧Sec per language for each model. The vertical bar marks the average of the six models."
    >
      <ModelLegend />
      <div className="ld">
        {ls.map((l) => (
          <div className="ld-row" key={l.lang}>
            <div className="ld-label">
              {l.label}
              <span>{l.scenarios} scenarios</span>
            </div>
            <div className="ld-track">
              {ticks.map((t) => (
                <span key={t} className="ld-grid" style={{ left: `${(t / max) * 100}%` }} />
              ))}
              <span className="ld-mean" style={{ left: `${(l.mean / max) * 100}%` }} title={`Average: ${fmt(l.mean)}%`} />
              {l.perModel.map((p) => (
                <span
                  key={p.model}
                  className="ld-dot"
                  style={cssVars({ "--x": `${(p.rate / max) * 100}%`, background: modelColor(p.model) })}
                  title={`${p.model} · ${l.label}: ${fmt(p.rate)}%`}
                />
              ))}
            </div>
            <div className="ld-val">{`${Math.round(l.mean)}%`}</div>
          </div>
        ))}
        <div className="ld-axis">
          <span />
          <div className="ld-axis-track">
            {ticks.map((t) => (
              <span key={t} style={{ left: `${(t / max) * 100}%` }}>{`${t}%`}</span>
            ))}
          </div>
          <span />
        </div>
      </div>
    </Figure>
  );
}

// ---------------------------------------------------------------- weakness map

function WeaknessMap() {
  const groups = owaspGroups();
  const K = 7.2; // pixels per square root of a scenario count
  const hardest = groups
    .flatMap((g) => g.items)
    .filter((w) => w.scenarios >= 5)
    .sort((a, b) => a.joint - b.joint)
    .slice(0, 3)
    .map((w) => w.name.toLowerCase());
  return (
    <Figure
      kicker="Weakness map"
      title={`Hardest to secure: ${joinNames(hardest)}`}
      sub="One bubble per CWE, grouped by its OWASP Top 10:2025 category and sized by its number of scenarios. Color shows how often the six models' code is both functional and secure."
    >
      <div className="wm-scale">
        <span>Func∧Sec</span>
        <span>0%</span>
        <span className="bar" />
        <span>40%+</span>
      </div>
      <div className="wm-grid">
        {groups.map((g) => {
          const { circles, w, h } = packCircles(g.items.map((it) => K * Math.sqrt(it.scenarios)));
          const pw = w + 10, ph = h + 10;
          return (
            <div className="wm-card" key={g.code || "outside"}>
              <p className="wm-code">{g.code ? `${g.code}:2025` : "Not in the Top 10"}</p>
              <p className="wm-name">{g.name}</p>
              <p className="wm-meta">{`${g.scenarios} scenarios · Func∧Sec ${fmt(g.joint)}%`}</p>
              <svg className="wm-svg" width={pw} height={ph} viewBox={`${-pw / 2} ${-ph / 2} ${pw} ${ph}`} role="img" aria-label={`${g.name}: ${g.items.map((it) => it.cwe).join(", ")}`}>
                {circles.map((c, i) => {
                  const it = g.items[i];
                  return (
                    <g key={it.cwe} style={cssVars({ "--h": rateHue(it.joint) })}>
                      <circle className="wm-bubble" cx={c.x} cy={c.y} r={c.r} style={{ transitionDelay: `${120 + i * 70}ms` }}>
                        <title>{`${it.cwe} ${it.name}: ${it.scenarios} scenarios, Func∧Sec ${fmt(it.joint)}%`}</title>
                      </circle>
                      {c.r >= 13 && (
                        <text className="wm-label" x={c.x} y={c.y} style={{ fontSize: `${Math.min(13, Math.max(9, c.r * 0.42))}px` }}>
                          {it.cwe.replace("CWE-", "")}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
              <ul className="wm-list">
                {g.items.map((it) => (
                  <li key={it.cwe} style={cssVars({ "--h": rateHue(it.joint) })}>
                    <b>{it.cwe}</b>
                    <span>{it.name}</span>
                    <span className="wm-rate">{`${fmt(it.joint)}%`}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Figure>
  );
}

// ---------------------------------------------------------------- model × category

const PLAIN: Record<string, string> = {
  "": "memory-safety bugs",
  A01: "broken access control",
  A05: "injection",
  A06: "insecure design",
  A07: "authentication failures",
  A08: "integrity failures",
  A10: "exception handling",
};

function Heatmap() {
  const groups = owaspGroups();
  const big = groups.filter((g) => g.scenarios >= 10).sort((a, b) => b.joint - a.joint);
  const cell = (rate: number) => cssVars({ "--h": rateHue(rate), "--a": (0.1 + Math.min(1, rate / 40) * 0.5).toFixed(2) });
  return (
    <Figure
      kicker="Model × category"
      title={`Most often secured: ${PLAIN[big[0].code]}. Least often: ${PLAIN[big[big.length - 1].code]}.`}
      sub="Func∧Sec for each model within each OWASP Top 10:2025 category. Categories with few scenarios move a lot with a single task."
    >
      <div className="hm-wrap">
        <table className="hm">
          <thead>
            <tr>
              <th />
              {ROWS.map((r) => (
                <th key={r.model} scope="col">
                  {r.model}
                </th>
              ))}
              <th scope="col">All</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.code || "outside"}>
                <th scope="row" className="row">
                  {g.name}
                  <span>{`${g.code ? `${g.code}:2025` : "outside the Top 10"} · ${g.scenarios} scenarios`}</span>
                </th>
                {g.perModel.map((p) => (
                  <td key={p.model} style={cell(p.rate)} title={`${p.model}: ${fmt(p.rate)}%`}>
                    {`${Math.round(p.rate)}%`}
                  </td>
                ))}
                <td className="all" style={cell(g.joint)}>{`${Math.round(g.joint)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Figure>
  );
}

export default function Analysis() {
  return (
    <section id="analysis" className="section">
      <div className="container-page">
        <Reveal>
          <div className="an-intro">
            <p className="section-kicker">Analysis</p>
            <h2 className="lb2-title">What the runs show</h2>
            <p className="lb2-sub">Every figure below comes from the same runs as the leaderboard: six models, all 450 tasks each.</p>
          </div>
        </Reveal>
        <FailureModes />
        <div className="an-pair">
          <Granularity />
          <Languages />
        </div>
        <WeaknessMap />
        <Heatmap />
      </div>
    </section>
  );
}
