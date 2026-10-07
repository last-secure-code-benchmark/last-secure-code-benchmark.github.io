export default function WhyItMatters() {
  return (
    <section className="section border-b border-line">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker">context</p>
          <h2 className="section-title mt-2">Why This Matters</h2>
        </div>
        <div className="content mx-auto mt-8 max-w-3xl">
          <p>
            Zoom out: what does your benchmark make concrete that the community previously only
            suspected? Link to your{" "}
            <a href="https://example.com/related-analysis" target="_blank" rel="noopener">
              related analysis
            </a>{" "}
            if you have one.
          </p>
          <p>
            Close with a call to action: what should practitioners, defenders, or policymakers do
            differently in light of these results? Two concrete recommendations work better than
            ten vague ones.
          </p>
        </div>
      </div>
    </section>
  );
}
