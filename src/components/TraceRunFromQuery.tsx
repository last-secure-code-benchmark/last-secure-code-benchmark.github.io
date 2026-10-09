"use client";

import { useSearchParams } from "next/navigation";
import TraceRun from "@/components/TraceRun";

/** Reads ?key=<model__agent>&task=<task> so one static page serves every trace. */
export default function TraceRunFromQuery() {
  const params = useSearchParams();
  const key = params.get("key") || "";
  const task = params.get("task") || "";
  if (!key || !task) {
    return (
      <p className="container-page py-16 font-mono text-sm text-zinc-500">
        No trace selected. Pick one from the <a href="/traces" className="text-acc hover:underline">traces browser</a>.
      </p>
    );
  }
  return <TraceRun trajKey={key} task={task} />;
}
