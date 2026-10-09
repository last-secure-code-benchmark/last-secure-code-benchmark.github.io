import type { CSSProperties, ReactNode } from "react";
import Reveal from "@/components/Reveal";
import {
  TIERS,
  TIER_LABEL,
  families,
  fmt,
  granularity,
  joinNames,
  languageOutcomes,
  outcomes,
  pct,
  scenarioGrid,
} from "@/lib/analysis";

const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties;

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

function OutcomeLegend() {
  return (
    <div className="an-legend">
      <span><i className="k-both" />Works and secure</span>
      <span><i className="k-vuln" />Works, still vulnerable</span>
      <span><i className="k-rest" />Does not work</span>
    </div>
  );
}

/** A green / gray / faint bar for one set of outcomes, in percent of tasks. */
function OutcomeBar({ both, funcOnly, title, delay = 0 }: { both: number; funcOnly: number; title: string; delay?: number }) {
  return (
    <div className="ob" title={title} style={{ transitionDelay: `${delay}ms` }}>
      <span className="ob-both" style={{ width: `${both}%` }}>{both >= 9 ? `${Math.round(both)}%` : ""}</span>
      <span className="ob-vuln" style={{ width: `${funcOnly}%` }}>{funcOnly >= 9 ? `${Math.round(funcOnly)}%` : ""}</span>
    </div>
  );
}

// ---------------------------------------------------------------- outcomes per model

function Outcomes() {
  const os = outcomes();
  const total = os.reduce((s, o) => s + o.n, 0);
  const vulnerable = os.reduce((s, o) => s + o.funcOnly, 0);
  return (
    <Figure
      kicker="Outcomes"
      title={`${Math.round(pct(vulnerable, total))}% of all ${total.toLocaleString("en-US")} runs end with code that works but is still vulnerable`}
      sub="The functional suite checks the feature the task asks for. The security suite replays the original attack against the running program."
    >
      <OutcomeLegend />
      {os.map((o, i) => (
        <div className="row2" key={o.model}>
          <div className="row2-name">
            {o.model}
            <span>{o.agent}</span>
          </div>
          <OutcomeBar
            both={pct(o.both, o.n)}
            funcOnly={pct(o.funcOnly, o.n)}
            delay={i * 90}
            title={`${o.model}: works and secure ${fmt(pct(o.both, o.n))}%, works but vulnerable ${fmt(pct(o.funcOnly, o.n))}%, does not work ${fmt(pct(o.n - o.both - o.funcOnly, o.n))}%`}
          />
        </div>
      ))}
    </Figure>
  );
}

// ---------------------------------------------------------------- granularity

function Context() {
  const { per, avg } = granularity();
  const W = 560, H = 300, L = 46, R = 150, T = 16, B = 34;
  const x = (i: number) => L + (i * (W - L - R)) / (TIERS.length - 1);
  const y = (v: number) => T + (1 - v / 100) * (H - T - B);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const joints = avg.map((a) => a.joint);
  const last = avg[avg.length - 1];
  return (
    <Figure
      kicker="More context"
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
          <path key={p.model} className="gr-line gr-model" d={path(p.points.map((q) => q.joint))} pathLength={1}>
            <title>{p.model}</title>
          </path>
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
  const ls = languageOutcomes();
  const hi = ls[0], lo = ls[ls.length - 1];
  return (
    <Figure
      kicker="Languages"
      title={`Secure code ranges from ${Math.round(hi.both)}% in ${hi.label} to ${Math.round(lo.both)}% in ${lo.label}`}
      sub="Outcomes of the six models together, by the language of the scenario."
    >
      <OutcomeLegend />
      {ls.map((l, i) => (
        <div className="row2" key={l.lang}>
          <div className="row2-name">
            {l.label}
            <span>{l.scenarios} scenarios</span>
          </div>
          <OutcomeBar
            both={l.both}
            funcOnly={l.funcOnly}
            delay={i * 80}
            title={`${l.label}: works and secure ${fmt(l.both)}%, works but vulnerable ${fmt(l.funcOnly)}%, does not work ${fmt(l.rest)}%`}
          />
        </div>
      ))}
    </Figure>
  );
}

// ---------------------------------------------------------------- weakness families

function Families() {
  const fs = families();
  const low = [...fs].sort((a, b) => a.secureShare - b.secureShare).slice(0, 2).map((f) => f.family.toLowerCase());
  return (
    <Figure
      kicker="Weakness families"
      title={`Working code is almost never secure for ${joinNames(low)}`}
      sub="For each family of CWEs in the paper, the gray bar shows how often the code works and the green bar how often it also passes the security suite. The number on the right is the share of working code that is secure."
    >
      <div className="fam">
        {fs.map((f, i) => (
          <div className="fam-row" key={f.family}>
            <div className="row2-name">
              {f.family}
              <span>{`${f.scenarios} scenarios · ${f.cwes.join(" · ")}`}</span>
            </div>
            <div className="fam-track" title={`${f.family}: works ${fmt(f.func)}%, works and secure ${fmt(f.joint)}%`} style={{ transitionDelay: `${i * 80}ms` }}>
              <span className="fam-func" style={{ width: `${f.func}%` }} />
              <span className="fam-joint" style={{ width: `${f.joint}%` }} />
            </div>
            <div className="fam-share">
              <b>{`${Math.round(f.secureShare)}%`}</b>
              <span>of working code is secure</span>
            </div>
          </div>
        ))}
      </div>
    </Figure>
  );
}

// ---------------------------------------------------------------- every scenario × every model

function ScenarioGrid() {
  const { models, scenarios, never, everyModel } = scenarioGrid();
  const n = scenarios.length;
  const firstNever = scenarios.findIndex((s) => s.total === 0);
  return (
    <Figure
      kicker="Every scenario"
      title={`${never} of ${n} scenarios were never secured by any model`}
      sub={`Each column is a scenario and each row a model. A cell turns greener with every granularity (function, file, repository) at which the model's code was both functional and secure. Only ${everyModel} scenarios were secured by all six models at one granularity or more.`}
    >
      <div className="an-legend">
        <span><i className="sg-c sg-0" />None</span>
        <span><i className="sg-c sg-1" />One granularity</span>
        <span><i className="sg-c sg-2" />Two</span>
        <span><i className="sg-c sg-3" />All three</span>
      </div>
      <div className="sg-wrap">
        <div className="sg" style={cssVars({ "--n": n })}>
          {models.map((m, mi) => (
            <div className="sg-row" key={m}>
              <span className="sg-label">{m}</span>
              {scenarios.map((s, si) => (
                <span
                  key={s.id}
                  className={`sg-c sg-${s.counts[mi]}`}
                  style={cssVars({ "--d": `${Math.round(si * 5)}ms` })}
                  title={`${s.id} · ${s.language} · ${s.cwe}\n${m}: secured at ${s.counts[mi]} of 3 granularities`}
                />
              ))}
            </div>
          ))}
          {firstNever >= 0 && (
            <div className="sg-row sg-note">
              <span className="sg-label" />
              <span className="sg-bracket" style={{ gridColumn: `${firstNever + 2} / ${n + 2}` }}>
                {`never secured · ${never}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </Figure>
  );
}

export default function Analysis() {
  return (
    <section id="analysis" className="section band">
      <div className="container-page">
        <Reveal>
          <div className="an-intro">
            <p className="section-kicker">Analysis</p>
            <h2 className="lb2-title">What the runs show</h2>
            <p className="lb2-sub">Every figure below comes from the same runs as the leaderboard: six models, all 450 tasks each.</p>
          </div>
        </Reveal>
        <Outcomes />
        <div className="an-pair">
          <Context />
          <Languages />
        </div>
        <Families />
        <ScenarioGrid />
      </div>
    </section>
  );
}
