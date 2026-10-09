/** Path prefix the site is served under. Empty at the root of
 *  last-secure-code-benchmark.github.io; set NEXT_PUBLIC_BASE_PATH to serve it
 *  under a sub-path, for example behind a preview proxy. */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

export const withBase = (path: string): string => `${BASE_PATH}${path}`;
