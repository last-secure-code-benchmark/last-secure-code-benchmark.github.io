"use client";

import { useEffect, useRef } from "react";

const CHARS = "アイウエオカキクケコサシスセソタチツテト0123456789<>/\\{}[]$#@!";

export default function MatrixRain({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSize = 14;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cols = 0;
    let drops: number[] = [];
    let raf = 0;
    let last = 0;

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / fontSize);
      drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -60));
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => window.removeEventListener("resize", resize);
    }

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < 50) return;
      last = t;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.fillStyle = "rgba(9, 9, 11, 0.12)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillStyle = Math.random() < 0.04 ? "#d1fae5" : "#34d399";
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.976) drops[i] = 0;
        drops[i]++;
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
