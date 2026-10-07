const FINDINGS = [
  {
    title: "Finding one: headline result",
    body: "Describe an interesting behavioral finding here. What did agents do that surprised you? Include concrete numbers once you have them. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    figure: "[ chart placeholder ]",
  },
  {
    title: "Finding two: comparison result",
    body: "Describe how different models or approaches diverge. Overlap analysis, unique solves, ensemble potential — anything that shows the strategies differ qualitatively, not just quantitatively.",
    figure: "[ venn / overlap chart ]",
  },
  {
    title: "Finding three: scaling result",
    body: "Describe what happens with more budget, more tokens, or more time. Does performance plateau or keep climbing? Which models benefit and which saturate early?",
    figure: "[ scaling curve ]",
  },
];

export default function Findings() {
  return (
    <section id="findings" className="section border-b border-line">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker">analysis</p>
          <h2 className="section-title mt-2">The Interesting Bits</h2>
        </div>

        <div className="mt-12 space-y-6">
          {FINDINGS.map((f, i) => (
            <div key={f.title} className="card">
              <h3 className="text-center font-mono text-lg font-bold text-zinc-50">{f.title}</h3>
              <div className="mt-6 grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                <div className={`fig-placeholder min-h-48 ${i % 2 === 1 ? "md:order-2" : ""}`}>
                  {f.figure}
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
