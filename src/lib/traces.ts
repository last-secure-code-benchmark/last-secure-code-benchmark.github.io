// Agent trajectories are not bundled with the site. They are read from the
// release repository, pinned to a release tag, so the site always shows the
// published traces. Set NEXT_PUBLIC_TRACES_BASE to point at another copy.
const RELEASE_BASE = "https://raw.githubusercontent.com/alibaba/last-secure-code-benchmark/v1.0";

export const TRACES_BASE = (process.env.NEXT_PUBLIC_TRACES_BASE || `${RELEASE_BASE}/traces`).replace(/\/$/, "");
export const TASKS_BASE = (process.env.NEXT_PUBLIC_TASKS_BASE || `${RELEASE_BASE}/tasks`).replace(/\/$/, "");

/** A file of one task in the release repository, e.g. its spec. */
export function taskFileUrl(task: string, path: string): string {
  return `${TASKS_BASE}/${encodeURIComponent(task)}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export const catalogUrl = `${TRACES_BASE}/catalog.json`;

export function traceUrl(trajKey: string, task: string): string {
  return `${TRACES_BASE}/${encodeURIComponent(trajKey)}/${encodeURIComponent(task)}.json`;
}

export function tracePageHref(trajKey: string, task: string): string {
  return `/traces/run/?key=${encodeURIComponent(trajKey)}&task=${encodeURIComponent(task)}`;
}
