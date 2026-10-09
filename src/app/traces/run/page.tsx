import type { Metadata } from "next";
import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import TraceRunFromQuery from "@/components/TraceRunFromQuery";

export const metadata: Metadata = {
  title: "Trace · Last Secure Code Benchmark",
};

export default function TraceRunPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={null}>
          <TraceRunFromQuery />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
