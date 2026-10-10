import Reveal from "@/components/Reveal";
import EmbeddedTrace from "@/components/EmbeddedTrace";
import cs from "@/data/case_study.json";
import { tracePageHref } from "@/lib/traces";
import { withBase } from "@/lib/base";

const TRAJ_KEY = "gpt-5-6-sol__codex";

/** Short, plain labels for the recorded phases of the example run. */
const PHASE_LABEL: Record<string, string> = {
  recon: "Read the spec and tests",
  implement: "Write index.js",
  test: "Run the tests",
  probe: "Probe its own work",
  summary: "Summarize",
};

export default function CaseStudy() {
  const phases = cs.phases.map((p) => {
    const key = p.label.split(/\s|—/)[0];
    return { key, label: PHASE_LABEL[key] ?? p.label, count: p.count };
  });
  const steps = phases.reduce((s, p) => s + p.count, 0);

  return (
    <section id="case-study" className="section band">
      <div className="container-page">
        <Reveal>
          <div className="an-intro">
            <p className="section-kicker">Example</p>
            <h2 className="lb2-title">One run, end to end</h2>
            <p className="lb2-sub">
              {cs.model} in {cs.agent} rebuilds <code>index.js</code> of image-tiler (CVE-2020-28451) at file granularity, from
              its specification alone. It passes both the functional and the security suite in {cs.time_min} minutes.
            </p>
          </div>
        </Reveal>

        <Reveal className="cs-phases" delay={100}>
          <p className="an-kicker">The agent&apos;s {steps} steps</p>
          <div className="cs-strip" role="img" aria-label={phases.map((p) => `${p.label}: ${p.count}`).join(", ")}>
            {phases.map((p) => (
              <span
                key={p.key}
                className={`cs-seg ${p.key === "implement" ? "is-code" : ""}`}
                style={{ flexGrow: p.count }}
                title={`${p.label}: ${p.count} step${p.count === 1 ? "" : "s"}`}
              >
                <b>{p.count}</b>
                <small>{p.label}</small>
              </span>
            ))}
          </div>
          <p className="an-note">
            A typical successful run: a short read, one implementation, one test run, then about half the run spent checking
            its own output (tile counts, formats, and command-line behavior) before it stops.
          </p>
        </Reveal>

        <Reveal className="cs-window" delay={180}>
          <div className="cs-window-head">
            <span>
              <b>{cs.task}</b> · {cs.model} / {cs.agent}
            </span>
            <a href={withBase(tracePageHref(TRAJ_KEY, cs.task))}>Open in the traces browser →</a>
          </div>
          <EmbeddedTrace trajKey={TRAJ_KEY} task={cs.task} />
        </Reveal>

        <p className="lb2-foot">
          This is one run of one agent on one task. It shows what a successful run looks like, not how often one happens; the{" "}
          <a href={withBase("/#leaderboard")}>leaderboard</a> has the aggregate picture, and all 2,700 runs are in the{" "}
          <a href={withBase("/traces")}>traces browser</a>.
        </p>
      </div>
    </section>
  );
}
