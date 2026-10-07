import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import Leaderboard from "@/components/Leaderboard";
import KeyTakeaways from "@/components/KeyTakeaways";
import Overview from "@/components/Overview";
import Scoring from "@/components/Scoring";
import Findings from "@/components/Findings";
import CaseStudy from "@/components/CaseStudy";
import WhyItMatters from "@/components/WhyItMatters";
import Citation from "@/components/Citation";
import SiteFooter from "@/components/SiteFooter";
import KonamiEgg from "@/components/KonamiEgg";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Leaderboard />
        <KeyTakeaways />
        <Overview />
        <Scoring />
        <Findings />
        <CaseStudy />
        <WhyItMatters />
        <Citation />
      </main>
      <SiteFooter />
      <KonamiEgg />
    </>
  );
}
