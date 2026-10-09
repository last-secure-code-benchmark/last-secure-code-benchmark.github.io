"use client";

import { useEffect, useRef } from "react";

/**
 * Site background: a faint minimap of source code, the material every task is
 * built from. Now and then a block of lines is masked, rebuilt line by line, and
 * judged. About one rebuilt block in four turns green (secure); the rest settle
 * back to gray. Static for readers who prefer less motion.
 */
const COL_W = 200; // width of one code column, CSS px
const COL_GAP = 84;
const LINE_H = 13;
const MAX_EVENTS = 3;
const SECURE_RATE = 0.25;
const MASK = 0.8, PER_LINE = 0.13, HOLD = 1.6, FADE = 1.4; // seconds

type Seg = { x: number; w: number };
type Line = { y: number; segs: Seg[] };
type Column = { x: number; lines: Line[] };
type MaskEvent = { col: number; from: number; to: number; t: number; secure: boolean };

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

    let W = 0, H = 0, DPR = 1, raf = 0, last = 0, spawnIn = 0.8;
    let cols: Column[] = [];
    let events: MaskEvent[] = [];
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

    const makeLines = (x0: number): Line[] => {
      const lines: Line[] = [];
      let indent = 0;
      for (let y = 20; y < H + LINE_H; y += LINE_H) {
        if (Math.random() < 0.1) {
          lines.push({ y, segs: [] });
          indent = Math.max(0, indent - 1);
          continue;
        }
        const r = Math.random();
        if (r < 0.22) indent = Math.min(4, indent + 1);
        else if (r < 0.4) indent = Math.max(0, indent - 1);
        let x = x0 + indent * 14;
        const segs: Seg[] = [];
        const n = 1 + Math.floor(Math.random() * 3);
        for (let k = 0; k < n; k++) {
          const w = rand(12, 64);
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
      const total = n * COL_W + (n - 1) * COL_GAP;
      const start = (W - total) / 2;
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
    const drawLine = (c: CanvasRenderingContext2D, line: Line, color: string, frac = 1) => {
      let budget = frac * line.segs.reduce((s, g) => s + g.w, 0);
      c.fillStyle = color;
      for (const g of line.segs) {
        if (budget <= 0) break;
        bar(c, g.x, line.y, Math.min(g.w, budget));
        budget -= g.w;
      }
    };

    const paintLayer = () => {
      layer.width = canvas.width;
      layer.height = canvas.height;
      lctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      lctx.clearRect(0, 0, W, H);
      for (const col of cols) for (const line of col.lines) drawLine(lctx, line, `rgba(${ink},0.08)`);
    };

    const duration = (e: MaskEvent) => MASK + (e.to - e.from + 1) * PER_LINE + HOLD + FADE;

    const spawn = () => {
      const ci = Math.floor(Math.random() * cols.length);
      const col = cols[ci];
      if (!col) return;
      const len = 3 + Math.floor(Math.random() * 6);
      const from = Math.floor(Math.random() * Math.max(1, col.lines.length - len));
      const to = Math.min(col.lines.length - 1, from + len - 1);
      if (col.lines.slice(from, to + 1).every((l) => !l.segs.length)) return;
      if (events.some((e) => e.col === ci && !(to + 2 < e.from || from > e.to + 2))) return;
      events.push({ col: ci, from, to, t: 0, secure: Math.random() < SECURE_RATE });
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(layer, 0, 0, W, H);
      for (const e of events) {
        const col = cols[e.col];
        const lines = col.lines.slice(e.from, e.to + 1);
        const top = lines[0].y - 6, bottom = lines[lines.length - 1].y + 9;
        const left = col.x - 8, width = COL_W + 16;
        ctx.clearRect(left - 1, top - 1, width + 2, bottom - top + 2);
        const rebuilt = MASK + lines.length * PER_LINE;

        // the mask frame and its label
        const frame = e.t < MASK ? e.t / MASK : e.t < rebuilt ? 1 : Math.max(0, 1 - (e.t - rebuilt) / 0.6);
        if (frame > 0) {
          ctx.save();
          ctx.setLineDash([3, 4]);
          ctx.strokeStyle = `rgba(${ink},${0.3 * frame})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(left + 0.5, top + 0.5, width - 1, bottom - top - 1);
          ctx.restore();
          ctx.font = `9px ${mono}`;
          ctx.fillStyle = `rgba(${ink},${0.4 * frame})`;
          ctx.fillText("<MASKED>", left + 6, top - 4);
        }

        // the rebuilt lines: typed in, then judged
        let color = `rgba(${ink},0.16)`;
        let tag = 0;
        if (e.t >= rebuilt) {
          const v = e.t - rebuilt;
          const k = v < HOLD ? Math.min(1, v / 0.3) : Math.max(0, 1 - (v - HOLD) / FADE);
          tag = k;
          color = e.secure ? `rgba(${safe},${0.1 + 0.55 * k})` : `rgba(${ink},${0.08 + 0.12 * k})`;
        }
        lines.forEach((ln, i) => {
          const f = Math.max(0, Math.min(1, (e.t - MASK - i * PER_LINE) / PER_LINE));
          if (f > 0) drawLine(ctx, ln, color, f);
        });
        if (tag > 0 && e.secure) {
          ctx.font = `600 9px ${mono}`;
          ctx.fillStyle = `rgba(${safe},${0.85 * tag})`;
          ctx.fillText("secure", left + width - 40, top - 4);
        }
      }
    };

    const update = (dt: number) => {
      for (const e of events) e.t += dt;
      events = events.filter((e) => e.t < duration(e));
      spawnIn -= dt;
      if (spawnIn <= 0) {
        if (events.length < MAX_EVENTS) spawn();
        spawnIn = rand(0.9, 2.2);
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
