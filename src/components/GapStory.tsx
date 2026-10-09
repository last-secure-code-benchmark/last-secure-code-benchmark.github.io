"use client";

import { useEffect, useRef, useState } from "react";

/** Shares of all tasks, in percent. */
export type StoryRow = { model: string; agent: string; both: number; funcOnly: number; rest: number };

const fmt = (x: number) => x.toFixed(1);

/** Shows `target` in static HTML; once armed it drops to 0, and counts up when `run` turns true. */
function useCountUp(target: number, armed: boolean, run: boolean, ms = 1400) {
  const [value, setValue] = useState(target);
  useEffect(() => {
    if (armed && !run) setValue(0);
  }, [armed, run]);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      setValue(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return value;
}

/** The headline result: how much of the top model's code works, and how much of it is also secure. */
export default function GapStory({ rows, nTasks }: { rows: StoryRow[]; nTasks: number }) {
  const ref = useRef<HTMLElement>(null);
  // static HTML shows the final state; the browser hides it until the section scrolls into view
  const [phase, setPhase] = useState<"static" | "armed" | "shown">("static");
  const shown = phase !== "armed";
  const best = rows[0];
  const works = useCountUp(best.both + best.funcOnly, phase === "armed", phase === "shown");
  const secure = useCountUp(best.both, phase === "armed", phase === "shown", 1700);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    setPhase("armed");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase("shown");
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id="gap" className={`section band gap ${shown ? "is-shown" : ""}`}>
      <div className="container-page">
        <p className="gap-kicker">The gap</p>
        <h2 className="gap-title">Agents write code that works, but rarely code that is secure.</h2>

        <div className="gap-stats">
          <div className="gap-stat">
            <span className="gap-big">{fmt(works)}%</span>
            <span className="gap-cap">of tasks end with working code</span>
          </div>
          <div className="gap-stat is-secure">
            <span className="gap-big">{fmt(secure)}%</span>
            <span className="gap-cap">end with code that works and is secure</span>
          </div>
        </div>

        <div className="gap-bar" role="img" aria-label={`${best.model}: ${fmt(best.both)}% works and is secure, ${fmt(best.funcOnly)}% works but is vulnerable`}>
          <span className="gap-both" style={{ width: shown ? `${best.both}%` : 0 }} />
          <span className="gap-vuln" style={{ width: shown ? `${best.funcOnly}%` : 0 }} />
        </div>
        <div className="gap-legend">
          <span><i className="k-both" />Works and secure</span>
          <span><i className="k-vuln" />Works, still vulnerable</span>
          <span><i className="k-rest" />Does not work</span>
        </div>

        <ul className="gap-models">
          {rows.map((r, i) => (
            <li key={r.model} style={{ transitionDelay: `${600 + i * 80}ms` }}>
              <span className="gm-name">{r.model}</span>
              <span className="gm-bar">
                <span className="gap-both" style={{ width: shown ? `${r.both}%` : 0, transitionDelay: `${700 + i * 80}ms` }} />
                <span className="gap-vuln" style={{ width: shown ? `${r.funcOnly}%` : 0, transitionDelay: `${700 + i * 80}ms` }} />
              </span>
              <span className="gm-val">{fmt(r.both)}%</span>
            </li>
          ))}
        </ul>

        <p className="gap-foot">
          Large numbers: {best.model}, the top model, on all {nTasks} tasks. Bars below: every model.
        </p>
      </div>
    </section>
  );
}
