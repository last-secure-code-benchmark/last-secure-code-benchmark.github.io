"use client";

import { useEffect, useRef } from "react";

/**
 * Site background: a minimap of source code that drifts with the page. Text
 * always sits on solid bands (.band), so the code shows only in the gaps between
 * them. In those gaps an agent implements code from a specification at one of
 * the benchmark's three scopes (a function, a file, or a repository spanning
 * several columns); about one finished block in four turns green (secure).
 */
const COL_W = 200; // width of one code column, CSS px
const COL_GAP = 76;
const LINE_H = 13;
const PARALLAX = 0.35; // the code moves at this fraction of the scroll speed
const MAX_EVENTS = 4;
const SECURE_RATE = 0.25;
const INTRO = 0.6, HOLD = 1.5, FADE = 1.2; // seconds
const SCOPES = [
  { name: "function", weight: 0.5, cols: 1, lines: [4, 6], perLine: 0.11 },
  { name: "file", weight: 0.35, cols: 1, lines: [11, 16], perLine: 0.07 },
  { name: "repo", weight: 0.15, cols: 3, lines: [8, 12], perLine: 0.08 },
] as const;

type Seg = { x: number; w: number };
type Line = { y: number; segs: Seg[] };
type Column = { x: number; lines: Line[] };
type Scope = (typeof SCOPES)[number];
type Build = { cols: number[]; from: number; to: number; t: number; secure: boolean; scope: Scope };

export default function CodeBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d");
    if (!lctx) return;

    let W = 0, H = 0, P = 0, DPR = 1, raf = 0, last = 0, spawnIn = 0.4;
    let cols: Column[] = [];
    let events: Build[] = [];
    let ink = "148,163,196", safe = "52,211,153";
    const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const triplet = (name: string, fallback: string) => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v ? v.split(/\s+/).join(",") : fallback;
    };
    const readColors = () => {
      ink = triplet("--code-ink", ink);
      safe = triplet("--safe", safe);
    };
    const offset = () => (reduce ? 0 : (((window.scrollY * PARALLAX) % P) + P) % P);

    const makeLines = (x0: number): Line[] => {
      const lines: Line[] = [];
      let indent = 0;
      for (let y = 20; y < P; y += LINE_H) {
        if (Math.random() < 0.16) {
          lines.push({ y, segs: [] });
          indent = Math.max(0, indent - 1);
          continue;
        }
        const r = Math.random();
        if (r < 0.22) indent = Math.min(4, indent + 1);
        else if (r < 0.4) indent = Math.max(0, indent - 1);
        let x = x0 + indent * 14;
        const segs: Seg[] = [];
        const n = Math.random() < 0.65 ? 1 : 2;
        for (let k = 0; k < n; k++) {
          const w = rand(14, 70);
          if (x + w > x0 + COL_W) break;
          segs.push({ x, w });
          x += w + rand(5, 9);
        }
        lines.push({ y, segs });
      }
      return lines;
    };

    const build = () => {
      const n = Math.max(1, Math.floor((W + COL_GAP) / (COL_W + COL_GAP)) + 1);
      const start = (W - (n * COL_W + (n - 1) * COL_GAP)) / 2;
      cols = Array.from({ length: n }, (_, i) => {
        const x = start + i * (COL_W + COL_GAP);
        return { x, lines: makeLines(x) };
      });
      events = [];
    };

    const bar = (c: CanvasRenderingContext2D, x: number, y: number, w: number) => {
      c.beginPath();
      if (typeof c.roundRect === "function") c.roundRect(x, y, w, 3, 1.5);
      else c.rect(x, y, w, 3);
      c.fill();
    };
    const drawLine = (c: CanvasRenderingContext2D, line: Line, dy: number, color: string, frac = 1) => {
      let budget = frac * line.segs.reduce((s, g) => s + g.w, 0);
      c.fillStyle = color;
      for (const g of line.segs) {
        if (budget <= 0) break;
        bar(c, g.x, line.y + dy, Math.min(g.w, budget));
        budget -= g.w;
      }
    };

    const paintLayer = () => {
      layer.width = Math.floor(W * DPR);
      layer.height = Math.floor(P * DPR);
      lctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      lctx.clearRect(0, 0, W, P);
      for (const col of cols) for (const line of col.lines) drawLine(lctx, line, 0, `rgba(${ink},0.065)`);
    };

    /** Vertical stretches of the viewport not covered by a solid band or the header. */
    const openSpans = (): [number, number][] => {
      const covered = Array.from(document.querySelectorAll(".band, header"))
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.bottom > 0 && r.top < H)
        .map((r) => [Math.max(0, r.top), Math.min(H, r.bottom)] as [number, number])
        .sort((a, b) => a[0] - b[0]);
      const open: [number, number][] = [];
      let y = 0;
      for (const [a, b] of covered) {
        if (a > y + 70) open.push([y, a]);
        y = Math.max(y, b);
      }
      if (H > y + 70) open.push([y, H]);
      return open;
    };

    const spawn = () => {
      const open = openSpans();
      const total = open.reduce((s, [a, b]) => s + (b - a), 0);
      if (!total || !cols.length) return;
      let pickY = Math.random() * total, sy = 0;
      for (const [a, b] of open) {
        if (pickY <= b - a) { sy = a + Math.min(pickY, b - a - 60); break; }
        pickY -= b - a;
      }
      let pickScope = Math.random();
      const scope = SCOPES.find((sc) => (pickScope -= sc.weight) <= 0) ?? SCOPES[0];
      const span = Math.min(scope.cols, cols.length);
      // on pages with a vertical band (.band-v), write code only in the side strips
      const blocked = Array.from(document.querySelectorAll(".band-v"))
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.bottom > 0 && r.top < H)
        .map((r) => [r.left - 56, r.right + 56] as [number, number]);
      const free = (ci: number) => blocked.every(([a, b]) => cols[ci].x + COL_W < a || cols[ci].x - 12 > b);
      const starts = Array.from({ length: cols.length - span + 1 }, (_, i) => i).filter((i) =>
        Array.from({ length: span }, (_, k) => free(i + k)).every(Boolean),
      );
      if (!starts.length) return;
      const c0 = starts[Math.floor(Math.random() * starts.length)];
      const picked = Array.from({ length: span }, (_, i) => c0 + i);
      const len = scope.lines[0] + Math.floor(Math.random() * (scope.lines[1] - scope.lines[0] + 1));
      const py = (sy + offset()) % P;
      const nLines = cols[c0].lines.length;
      const from = Math.max(0, Math.min(nLines - len, Math.floor((py - 20) / LINE_H)));
      const to = from + len - 1;
      if (events.some((e) => e.cols.some((c) => picked.includes(c)) && !(to + 2 < e.from || from > e.to + 2))) return;
      events.push({ cols: picked, from, to, t: 0, secure: Math.random() < SECURE_RATE, scope });
    };

    const written = (e: Build) => INTRO + (e.to - e.from + 1) * e.scope.perLine;
    const duration = (e: Build) => written(e) + HOLD + FADE;

    const draw = () => {
      const off = offset();
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(layer, 0, -off, W, P);
      if (P - off < H) ctx.drawImage(layer, 0, P - off, W, P);
      for (const e of events) {
        const first = cols[e.cols[0]].lines;
        let dy = -off;
        if (first[e.from].y + dy < -260) dy += P;
        const top = first[e.from].y + dy - 6, bottom = first[e.to].y + dy + 9;
        if (bottom < 0 || top > H) continue;
        const done = written(e);
        const v = e.t - done;
        const verdict = e.t < done ? 0 : v < HOLD ? Math.min(1, v / 0.25) : Math.max(0, 1 - (v - HOLD) / FADE);
        const intro = Math.min(1, e.t / INTRO) * (e.t < done + HOLD ? 1 : verdict);
        const lit = e.secure && verdict > 0;

        e.cols.forEach((ci, k) => {
          const col = cols[ci];
          const left = col.x - 12;
          ctx.clearRect(left - 2, top - 1, COL_W + 16, bottom - top + 2);
          // change gutter: new code is being written here
          ctx.fillStyle = lit ? `rgba(${safe},${0.25 + 0.65 * verdict})` : `rgba(${ink},${0.45 * intro})`;
          ctx.fillRect(left, top, 2, bottom - top);
          if (k === 0) {
            ctx.font = `10px ${mono}`;
            ctx.fillStyle = `rgba(${ink},${0.6 * intro})`;
            ctx.fillText(e.scope.name, left, top - 6);
            if (lit) {
              ctx.font = `600 10px ${mono}`;
              ctx.fillStyle = `rgba(${safe},${0.95 * verdict})`;
              ctx.fillText("secure", left + ctx.measureText(e.scope.name).width + 26, top - 6);
            }
          }
          const color = lit ? `rgba(${safe},${0.14 + 0.7 * verdict})` : `rgba(${ink},${0.14 + 0.14 * Math.max(intro, verdict)})`;
          for (let i = e.from; i <= e.to; i++) {
            const f = Math.max(0, Math.min(1, (e.t - INTRO - (i - e.from) * e.scope.perLine) / e.scope.perLine));
            if (f > 0) drawLine(ctx, col.lines[i], dy, color, f);
          }
        });
      }
    };

    const update = (dt: number) => {
      for (const e of events) e.t += dt;
      events = events.filter((e) => e.t < duration(e));
      spawnIn -= dt;
      if (spawnIn <= 0) {
        if (events.length < MAX_EVENTS) spawn();
        spawnIn = rand(0.45, 1.1);
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      // Mobile browsers resize the viewport while scrolling; rebuild only when the code would not cover it.
      if (cols.length && w === W && h <= H) return;
      W = w;
      H = h;
      P = Math.ceil((Math.max(H, 700) * 1.6) / LINE_H) * LINE_H;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
      paintLayer();
      draw();
    };

    readColors();
    resize();
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(resize, 150);
    };
    const themeObserver = new MutationObserver(() => {
      readColors();
      paintLayer();
      draw();
    });
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    window.addEventListener("resize", onResize);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduce) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      themeObserver.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="code-bg" aria-hidden="true" />;
}
