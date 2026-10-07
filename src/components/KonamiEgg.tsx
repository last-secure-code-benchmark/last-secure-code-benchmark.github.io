"use client";

import { useEffect, useState } from "react";
import MatrixRain from "./MatrixRain";

const SEQ = [
  "arrowup", "arrowup",
  "arrowdown", "arrowdown",
  "arrowleft", "arrowright",
  "arrowleft", "arrowright",
  "b", "a",
];

export default function KonamiEgg() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let idx = 0;
    const onKey = (e: KeyboardEvent) => {
      if (active) {
        setActive(false);
        return;
      }
      const k = e.key.toLowerCase();
      idx = k === SEQ[idx] ? idx + 1 : k === SEQ[0] ? 1 : 0;
      if (idx === SEQ.length) {
        idx = 0;
        setActive(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(false), 6000);
    return () => clearTimeout(t);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[200] cursor-pointer bg-black/85"
      onClick={() => setActive(false)}
      role="presentation"
    >
      <MatrixRain className="h-full w-full opacity-70" />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <p className="text-glow font-mono text-4xl font-bold tracking-widest text-acc sm:text-6xl">
          ACCESS GRANTED
        </p>
        <p className="mt-4 font-mono text-sm text-zinc-400">
          konami code accepted · welcome, root
        </p>
        <p className="mt-6 font-mono text-xs text-zinc-600">
          [ click anywhere or press any key to close ]
        </p>
      </div>
    </div>
  );
}
