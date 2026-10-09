"use client";

import { useEffect, useRef } from "react";

/**
 * Site background: a minimap of source code that drifts with the page. Text
 * always sits on solid bands (.band), so the code shows only in the gaps between
 * them. In those gaps, blocks of lines are masked, rebuilt line by line, and
 * judged: about one rebuilt block in four turns green (secure).
 */
const COL_W = 200; // width of one code column, CSS px
const COL_GAP = 76;
const LINE_H = 13;
const PARALLAX = 0.35; // the code moves at this fraction of the scroll speed
const MAX_EVENTS = 4;
const SECURE_RATE = 0.25;
const MASK = 0.7, PER_LINE = 0.11, HOLD = 1.5, FADE = 1.2; // seconds

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

    let W = 0, H = 0, P = 0, DPR = 1, raf = 0, last = 0, spawnIn = 0.4;
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
      for (const col of cols) for (const line of col.lines) drawLine(lctx, line, 0, `rgba(${ink},0.12)`);
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
      const ci = Math.floor(Math.random() * cols.length);
      const col = cols[ci];
      const py = (sy + offset()) % P;
      const len = 3 + Math.floor(Math.random() * 5);
      const from = Math.max(0, Math.min(col.lines.length - len, Math.floor((py - 20) / LINE_H)));
      const to = from + len - 1;
      if (col.lines.slice(from, to + 1).every((l) => !l.segs.length)) return;
      if (events.some((e) => e.col === ci && !(to + 2 < e.from || from > e.to + 2))) return;
      events.push({ col: ci, from, to, t: 0, secure: Math.random() < SECURE_RATE });
    };

    const duration = (e: MaskEvent) => MASK + (e.to - e.from + 1) * PER_LINE + HOLD + FADE;

    const draw = () => {
      const off = offset();
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(layer, 0, -off, W, P);
      if (P - off < H) ctx.drawImage(layer, 0, P - off, W, P);
      for (const e of events) {
        const col = cols[e.col];
        const lines = col.lines.slice(e.from, e.to + 1);
        let dy = -off;
        if (lines[0].y + dy < -120) dy += P;
        const top = lines[0].y + dy - 6, bottom = lines[lines.length - 1].y + dy + 9;
        if (bottom < 0 || top > H) continue;
        const left = col.x - 8, width = COL_W + 16;
        ctx.clearRect(left - 1, top - 1, width + 2, bottom - top + 2);
        const rebuilt = MASK + lines.length * PER_LINE;

        const frame = e.t < MASK ? e.t / MASK : e.t < rebuilt ? 1 : Math.max(0, 1 - (e.t - rebuilt) / 0.6);
        if (frame > 0) {
          ctx.save();
          ctx.setLineDash([3, 4]);
          ctx.strokeStyle = `rgba(${ink},${0.45 * frame})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(left + 0.5, top + 0.5, width - 1, bottom - top - 1);
          ctx.restore();
          ctx.font = `10px ${mono}`;
          ctx.fillStyle = `rgba(${ink},${0.6 * frame})`;
          ctx.fillText("<MASKED>", left + 6, top - 5);
        }

        let color = `rgba(${ink},0.26)`;
        let tag = 0;
        if (e.t >= rebuilt) {
          const v = e.t - rebuilt;
          const k = v < HOLD ? Math.min(1, v / 0.25) : Math.max(0, 1 - (v - HOLD) / FADE);
          tag = k;
          color = e.secure ? `rgba(${safe},${0.14 + 0.7 * k})` : `rgba(${ink},${0.12 + 0.14 * k})`;
        }
        lines.forEach((ln, i) => {
          const f = Math.max(0, Math.min(1, (e.t - MASK - i * PER_LINE) / PER_LINE));
          if (f > 0) drawLine(ctx, ln, dy, color, f);
        });
        if (tag > 0 && e.secure) {
          ctx.font = `600 10px ${mono}`;
          ctx.fillStyle = `rgba(${safe},${0.95 * tag})`;
          ctx.fillText("secure", left + width - 44, top - 5);
        }
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
