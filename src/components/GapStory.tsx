"use client";

import { useEffect, useRef, useState } from "react";

/** Shares of all tasks, in percent. */
export type StoryRow = { model: string; agent: string; both: number; funcOnly: number; rest: number };

function useTween(target: number, ms = 900) {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      const cur = a + (target - a) * (1 - Math.pow(1 - k, 3));
      from.current = cur;
      setValue(cur);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

const fmt = (x: number) => x.toFixed(1);

/** Scroll-driven story: working code, then how little of it is secure, then every model. */
export default function GapStory({ rows, nTasks }: { rows: StoryRow[]; nTasks: number }) {
  const wrap = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [still, setStill] = useState(false);
  const best = rows[0];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      setStep(3);
      return;
    }
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = wrap.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / Math.max(1, total)));
      setStep(progress < 0.1 ? 0 : progress < 0.38 ? 1 : progress < 0.66 ? 2 : 3);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const func = best.both + best.funcOnly;
  const joints = rows.map((r) => r.both);
  const lo = Math.min(...joints), hi = Math.max(...joints);
  const num = useTween(step === 0 ? 0 : step === 1 ? func : best.both);
  const lines = [
    "Ask a frontier agent to rebuild a piece of real software.",
    `The code works ${Math.round(func)}% of the time.`,
    `It is also secure ${Math.round(best.both)}% of the time.`,
    "Every model leaves the same gap.",
  ];
  const caption =
    step <= 1
      ? "of tasks end with working code"
      : step === 2
        ? "of tasks end with code that works and is secure"
        : "of tasks end with code that works and is secure, across six frontier models";

  return (
    <section ref={wrap} id="gap" className={`gap-story ${still ? "is-still" : ""}`} aria-label="How much working code is also secure">
      <div className="gap-sticky">
        <div className="container-page gap-inner">
          <p className="gap-kicker">The gap</p>
          <div className="gap-lines">
            {lines.map((line, i) => (
              <h2 key={i} className={`gap-line ${step === i ? "on" : ""}`} aria-hidden={step !== i}>
                {line}
              </h2>
            ))}
          </div>

          <div className={`gap-figure ${step >= 1 ? "on" : ""}`}>
            <p className="gap-num">
              <span>{step === 3 ? `${Math.round(lo)}–${Math.round(hi)}%` : `${fmt(num)}%`}</span>
              <small>{caption}</small>
            </p>
            <div
              className={`gap-bar ${step >= 2 ? "split" : ""}`}
              role="img"
              aria-label={`${best.model}: ${fmt(best.both)}% works and is secure, ${fmt(best.funcOnly)}% works but is vulnerable`}
            >
              <span className="gap-seg gap-both" style={{ width: step >= 1 ? `${best.both}%` : 0 }} />
              <span className="gap-seg gap-vuln" style={{ width: step >= 1 ? `${best.funcOnly}%` : 0 }} />
            </div>
            <div className={`gap-legend ${step >= 2 ? "on" : ""}`}>
              <span><i className="k-both" />Works and secure <b>{fmt(best.both)}%</b></span>
              <span><i className="k-vuln" />Works, still vulnerable <b>{fmt(best.funcOnly)}%</b></span>
              <span><i className="k-rest" />Does not work <b>{fmt(best.rest)}%</b></span>
            </div>
            <ul className={`gap-models ${step >= 3 ? "on" : ""}`}>
              {rows.map((r, i) => (
                <li key={r.model} style={{ transitionDelay: `${i * 70}ms` }}>
                  <span className="gm-name">{r.model}</span>
                  <span className="gm-bar">
                    <span className="gap-both" style={{ width: `${r.both}%` }} />
                    <span className="gap-vuln" style={{ width: `${r.funcOnly}%` }} />
                  </span>
                  <span className="gm-val">{fmt(r.both)}%</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="gap-foot">
            {step <= 2 ? `${best.model}, the top model, on all ${nTasks} tasks.` : `Share of the ${nTasks} tasks, per model.`}
          </p>
        </div>
      </div>
    </section>
  );
}
