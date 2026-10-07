import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import TraceRun from "@/components/TraceRun";

export const metadata: Metadata = {
  title: "Trace · Last Secure Code Benchmark",
};

export default async function TraceRunPage({
  params,
}: {
  params: Promise<{ key: string; task: string }>;
}) {
  const { key, task } = await params;
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <TraceRun trajKey={key} task={decodeURIComponent(task)} />
      </main>
      <SiteFooter />
    </>
  );
}
