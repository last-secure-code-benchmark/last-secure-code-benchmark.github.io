"use client";

import { useEffect, useRef } from "react";

/**
 * Site background: a faint graph of code units. Exploit probes walk its edges;
 * where a probe lands, the node either gives way (coral) or holds (emerald) at
 * about the rate the benchmark measures. Static for readers who prefer less motion.
 */
const GAP = 92; // mesh spacing in CSS pixels
const PROBES = 5;
const HOLD_RATE = 0.25; // share of landings that hold
const LAND_RATE = 0.35; // share of arrivals that count as a landing

type MeshNode = { x: number; y: number; flare: number; held: boolean };
type Probe = { from: number; to: number; t: number; speed: number };

export default function MeshBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d");
    if (!lctx) return;

    let W = 0, H = 0, DPR = 1, raf = 0, last = 0;
    let nodes: MeshNode[] = [];
    let adj: number[][] = [];
    let edges: [number, number][] = [];
    let probes: Probe[] = [];
    let ink = "148,163,196", safe = "52,211,153", breach = "251,113,133";

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const triplet = (name: string, fallback: string) => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v ? v.split(/\s+/).join(",") : fallback;
    };
    const readColors = () => {
      ink = triplet("--mesh-ink", ink);
      safe = triplet("--safe", safe);
      breach = triplet("--breach", breach);
    };

    const next = (node: number, avoid: number) => {
      const ns = adj[node];
      if (!ns || !ns.length) return Math.floor(Math.random() * nodes.length);
      const choices = ns.length > 1 ? ns.filter((n) => n !== avoid) : ns;
      return choices[Math.floor(Math.random() * choices.length)];
    };

    const build = () => {
      nodes = [];
      edges = [];
      const cols = Math.max(2, Math.round(W / GAP) + 2);
      const rows = Math.max(2, Math.round(H / GAP) + 2);
      const sx = W / (cols - 2), sy = H / (rows - 2);
      const idx = (i: number, j: number) => j * cols + i;
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++)
          nodes.push({ x: (i - 0.5) * sx + rand(-0.3, 0.3) * sx, y: (j - 0.5) * sy + rand(-0.3, 0.3) * sy, flare: 0, held: false });
      adj = nodes.map(() => []);
      const link = (a: number, b: number) => {
        edges.push([a, b]);
        adj[a].push(b);
        adj[b].push(a);
      };
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const a = idx(i, j);
          if (i + 1 < cols) link(a, idx(i + 1, j));
          if (j + 1 < rows) link(a, idx(i, j + 1));
          if (i + 1 < cols && j + 1 < rows && Math.random() < 0.18) link(a, idx(i + 1, j + 1));
          if (i > 0 && j + 1 < rows && Math.random() < 0.08) link(a, idx(i - 1, j + 1));
        }
      probes = Array.from({ length: PROBES }, () => {
        const from = Math.floor(Math.random() * nodes.length);
        return { from, to: next(from, -1), t: Math.random(), speed: rand(55, 105) };
      });
    };

    const paintLayer = () => {
      layer.width = canvas.width;
      layer.height = canvas.height;
      lctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      lctx.clearRect(0, 0, W, H);
      lctx.strokeStyle = `rgba(${ink},0.075)`;
      lctx.lineWidth = 1;
      lctx.beginPath();
      for (const [a, b] of edges) {
        lctx.moveTo(nodes[a].x, nodes[a].y);
        lctx.lineTo(nodes[b].x, nodes[b].y);
      }
      lctx.stroke();
      lctx.fillStyle = `rgba(${ink},0.2)`;
      for (const n of nodes) lctx.fillRect(n.x - 1, n.y - 1, 2, 2);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(layer, 0, 0, W, H);
      for (const n of nodes) {
        if (n.flare <= 0) continue;
        const c = n.held ? safe : breach, f = n.flare;
        ctx.fillStyle = `rgba(${c},${0.12 * f})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 5 + 16 * (1 - f), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${c},${0.35 + 0.6 * f})`;
        ctx.fillRect(n.x - 1.5, n.y - 1.5, 3, 3);
        if (n.held) {
          ctx.strokeStyle = `rgba(${c},${0.7 * f})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(n.x - 5, n.y - 5, 10, 10);
        }
      }
      for (const p of probes) {
        const a = nodes[p.from], b = nodes[p.to];
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
        const t0 = Math.max(0, p.t - 0.4);
        const x0 = a.x + (b.x - a.x) * t0, y0 = a.y + (b.y - a.y) * t0;
        const g = ctx.createLinearGradient(x0, y0, x, y);
        g.addColorStop(0, `rgba(${ink},0)`);
        g.addColorStop(1, `rgba(${ink},0.5)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = `rgba(${ink},0.85)`;
        ctx.beginPath();
        ctx.arc(x, y, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const update = (dt: number) => {
      for (const p of probes) {
        const a = nodes[p.from], b = nodes[p.to];
        const len = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
        p.t += (p.speed * dt) / len;
        if (p.t >= 1) {
          if (Math.random() < LAND_RATE) {
            const n = nodes[p.to];
            n.flare = 1;
            n.held = Math.random() < HOLD_RATE;
          }
          const prev = p.from;
          p.from = p.to;
          p.to = next(p.to, prev);
          p.t = 0;
        }
      }
      for (const n of nodes) if (n.flare > 0) n.flare = Math.max(0, n.flare - dt * 0.5);
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
      // Mobile browsers resize the viewport while scrolling; only rebuild when the mesh would not cover it.
      if (nodes.length && w === W && h <= H) return;
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

  return <canvas ref={ref} className="mesh-bg" aria-hidden="true" />;
}
