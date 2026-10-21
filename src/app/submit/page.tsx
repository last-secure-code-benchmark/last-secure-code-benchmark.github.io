import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Submit · Last Secure Code Benchmark",
  description: "Add your agent and model to the LSCBench leaderboard, or have us evaluate it.",
};

const REPO = "https://github.com/alibaba/last-secure-code-benchmark";
const GUIDE = `${REPO}/blob/main/submissions/README.md`;
const EMAIL = "tianyi_wu@u.nus.edu";

const RUN = `harbor run -d last-secure-code-benchmark/last-secure-code-benchmark@v1.0 \\
  -a <agent> -m <model> --allow-agent-host <model API host> \\
  --jobs-dir jobs`;

const TREE = `submissions/v1.0/<agent>__<model>/
├── metadata.yaml
├── README.md             your setup and notes on the run
└── jobs/<job-name>/      the Harbor job directory, unchanged
    ├── config.json
    ├── result.json
    └── <task>__<id>/     one folder per task
        ├── result.json
        ├── agent/        trajectory and logs
        └── verifier/     reward.json and test output`;

const METADATA = `agent:
  name: Claude Code
  version: 2.1.143
  url: https://github.com/anthropics/claude-code
model:
  name: my-model
  display_name: My Model
  provider: My Org
  reasoning_effort: high
settings: default
submitter:
  name: Jane Doe
  organization: My Org
  email: jane@example.org
paper_url:          # optional
job_url:            # only if jobs/ is hosted elsewhere
results:            # from Harbor's job summary
  functional: 0.000
  secure: 0.000
  reward: 0.000`;

const RULES: [string, string][] = [
  ["All 450 tasks, one attempt each", "pass@1. No reruns of failed tasks and no best-of-k. If infrastructure errors stop some tasks, rerun only those and say so."],
  ["Unmodified tasks", "Use @v1.0 from Harbor Hub as published: same instructions, environments, tests, timeouts, and resource limits."],
  ["No security hints", "Nothing in the prompt, system prompt, or agent configuration may remind the agent about security."],
  ["Model API only", "The agent may reach the model API host and nothing else, the default task setting."],
  ["No LSCBench material", "The agent may not read this repository, its traces, the website, or the Hub pages."],
];

function Code({ children }: { children: string }) {
  return (
    <div className="bibtex-box mt-3">
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h3 className="flex items-baseline gap-3 text-base font-semibold text-zinc-200">
        <span className="font-mono text-sm text-acc">{n}</span>
        {title}
      </h3>
      <div className="mt-2 text-sm leading-relaxed text-zinc-400">{children}</div>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 band-v">
        <section className="section">
          <div className="container-page">
            <div className="max-w-2xl">
              <p className="section-kicker">leaderboard</p>
              <h1 className="section-title mt-2">Submit Your Results</h1>
              <p className="mt-3 text-sm text-zinc-400">
                Run LSCBench yourself and send us the Harbor job directory through a pull request,
                or have us run the evaluation for you. Either way, every leaderboard entry comes
                with its full trajectories.
              </p>
            </div>

            <div className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
              <a href="#github" className="card block !p-5 border-acc/40 hover:border-acc">
                <div className="font-mono text-xs font-semibold uppercase tracking-wider text-acc">
                  Option A · pull request
                </div>
                <p className="mt-2 text-sm text-zinc-300">Run it yourself, submit on GitHub</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Run all 450 tasks once, then open a pull request with the job directory and a
                  metadata.yaml.
                </p>
              </a>
              <a href="#contact" className="card block !p-5 hover:border-acc">
                <div className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Option B · contact us
                </div>
                <p className="mt-2 text-sm text-zinc-300">Have us evaluate your model</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Give us API access and we run the leaderboard setup for you, including for models
                  that are not public yet.
                </p>
              </a>
            </div>

            <div id="github" className="mt-14 max-w-3xl scroll-mt-20">
              <p className="section-kicker">option a</p>
              <h2 className="section-title mt-2 !text-2xl">Submit on GitHub</h2>

              <Step n={1} title="Run the benchmark">
                <p>
                  Run all 450 tasks of v1.0 from Harbor Hub, one attempt per task. Setup is in the{" "}
                  <a href={`${REPO}#running`} className="text-acc hover:underline" target="_blank" rel="noopener">
                    repository README
                  </a>
                  . The mean of <span className="font-mono">reward</span> (Func∧Sec) in Harbor&apos;s
                  job summary is the leaderboard score.
                </p>
                <Code>{RUN}</Code>
              </Step>

              <Step n={2} title="Follow the rules">
                <ul className="space-y-2">
                  {RULES.map(([k, v]) => (
                    <li key={k} className="flex gap-2">
                      <span className="text-zinc-600">·</span>
                      <span>
                        <span className="text-zinc-200">{k}.</span> {v}
                      </span>
                    </li>
                  ))}
                </ul>
              </Step>

              <Step n={3} title="Prepare the submission folder">
                <p>
                  Add one folder under <span className="font-mono">submissions/v1.0/</span>. Keep the
                  trajectories: they are what lets us check the run. If the job directory is too
                  large for a pull request, host a compressed copy publicly and set{" "}
                  <span className="font-mono">job_url</span> instead.
                </p>
                <Code>{TREE}</Code>
                <p className="mt-4">
                  <span className="font-mono">metadata.yaml</span>:
                </p>
                <Code>{METADATA}</Code>
              </Step>

              <Step n={4} title="Open the pull request">
                <p>
                  Open a pull request against{" "}
                  <a href={REPO} className="text-acc hover:underline" target="_blank" rel="noopener">
                    alibaba/last-secure-code-benchmark
                  </a>{" "}
                  titled <span className="font-mono">Submission: &lt;agent&gt; + &lt;model&gt;</span>.
                  We check that the job covers all 450 tasks with one trial each, recompute the
                  scores from the <span className="font-mono">reward.json</span> files, and read a
                  sample of trajectories. We may ask for the run command to rerun a random subset.
                  Then we merge it and add the entry to the leaderboard.
                </p>
                <p className="mt-3">
                  The full format is in{" "}
                  <a href={GUIDE} className="text-acc hover:underline" target="_blank" rel="noopener">
                    submissions/README.md
                  </a>
                  .
                </p>
              </Step>
            </div>

            <div id="contact" className="mt-16 max-w-3xl scroll-mt-20">
              <p className="section-kicker">option b</p>
              <h2 className="section-title mt-2 !text-2xl">Have Us Evaluate Your Model</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                If you can&apos;t run the benchmark yourself, or the model is not public yet, email
                us the model, how to access it (endpoint and rate limits), and the agent you want
                it evaluated with. We run the same setup as the leaderboard and send you the
                results. We publish them only with your agreement.
              </p>
              <a
                href={`mailto:${EMAIL}?subject=${encodeURIComponent("LSCBench evaluation request")}`}
                className="btn btn-ghost mt-5 inline-flex text-sm"
              >
                Email {EMAIL}
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
