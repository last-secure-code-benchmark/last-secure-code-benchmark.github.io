import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import Leaderboard from "@/components/Leaderboard";
import Overview from "@/components/Overview";
import Scoring from "@/components/Scoring";
import CaseStudy from "@/components/CaseStudy";
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
