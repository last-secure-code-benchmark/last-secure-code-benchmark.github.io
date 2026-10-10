"use client";

import { useEffect, useState } from "react";
import TaskDetailView from "@/components/TaskDetail";
import { traceUrl } from "@/lib/traces";
import type { TaskTrajectory } from "@/lib/types";

/** The full trace viewer for one run, loaded from the release repository. */
export default function EmbeddedTrace({ trajKey, task }: { trajKey: string; task: string }) {
  const [detail, setDetail] = useState<TaskTrajectory | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let dead = false;
    fetch(traceUrl(trajKey, task))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => !dead && setDetail(d as TaskTrajectory))
      .catch(() => !dead && setFailed(true));
    return () => {
      dead = true;
    };
  }, [trajKey, task]);

  if (detail) return <TaskDetailView taskId={task} detail={detail} />;
  return (
    <div className="embed-wait">
      <p>{failed ? "The trace could not be loaded." : "Loading the trace…"}</p>
    </div>
  );
}
