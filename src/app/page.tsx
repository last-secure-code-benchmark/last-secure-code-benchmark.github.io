import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import GapStory, { type StoryRow } from "@/components/GapStory";
import Analysis from "@/components/Analysis";
import { N_SCENARIOS, N_TASKS, ROWS, outcomes, pct, score } from "@/lib/analysis";
import Leaderboard from "@/components/Leaderboard";
import Overview from "@/components/Overview";
import Scoring from "@/components/Scoring";
import CaseStudy from "@/components/CaseStudy";
import Citation from "@/components/Citation";
import SiteFooter from "@/components/SiteFooter";
import KonamiEgg from "@/components/KonamiEgg";

export default function Home() {
  const story: StoryRow[] = outcomes().map((o) => ({
    model: o.model,
    agent: o.agent,
    both: pct(o.both, o.n),
    funcOnly: pct(o.funcOnly, o.n),
    rest: pct(o.n - o.both - o.funcOnly, o.n),
  }));
  const board = ROWS.map((r) => ({ model: r.model, agent: r.agent, ...score(r) }));
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <GapStory rows={story} nTasks={N_TASKS} />
        <Leaderboard rows={board} nTasks={N_TASKS} nScenarios={N_SCENARIOS} />
        <Analysis />
        <Overview />
        <Scoring />
        <CaseStudy />
        <Citation />
      </main>
      <SiteFooter />
      <KonamiEgg />
    </>
  );
}
