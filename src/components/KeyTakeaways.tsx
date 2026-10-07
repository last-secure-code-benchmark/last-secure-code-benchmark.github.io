const TAKEAWAYS = [
  {
    title: "Takeaway one",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Summarize your single most important finding here — one strong claim supported by your results.",
  },
  {
    title: "Takeaway two",
    body: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Describe a second headline result, e.g. how defenses, scale, or budget change the outcome.",
  },
  {
    title: "Takeaway three",
    body: "Ut enim ad minim veniam, quis nostrud exercitation ullamco. Note limitations, dual-use considerations, or what the community should do next.",
  },
];

export default function KeyTakeaways() {
  return (
    <section className="section border-b border-line">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker">tl;dr</p>
          <h2 className="section-title mt-2">Key Takeaways</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TAKEAWAYS.map((t, i) => (
            <div key={t.title} className="card">
              <p className="font-mono text-xs text-acc">0{i + 1}</p>
              <h3 className="mt-2 text-lg font-bold text-zinc-50">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
