"use client";
import { useEffect, useRef } from "react";

/**
 * Decorative neural field. Left side: organic, curved connections.
 * Right side: the same network snapped to a measured grid with straight edges.
 * Signals travel along edges (learning), and the cursor wakes up nearby nodes
 * (human attention activates the system). Purely visual: aria-hidden, no content.
 */
type Node = { x: number; y: number; bx: number; by: number; ph: number; r: number };
type Edge = { a: number; b: number };
type Pulse = { e: number; t: number; v: number };

export default function NeuralField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, last = 0;
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let pulses: Pulse[] = [];
    const mouse = { x: -9999, y: -9999 };
    const GRID = 44;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(78, Math.max(28, (w * h) / 16000)));
      // seeded pseudo random for a stable composition
      let s = 7;
      const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      nodes = Array.from({ length: count }, () => {
        let x = rnd() * w, y = rnd() * h;
        if (x / w > 0.58) { x = Math.round(x / GRID) * GRID; y = Math.round(y / GRID) * GRID; }
        return { x, y, bx: x, by: y, ph: rnd() * Math.PI * 2, r: 1 + rnd() * 1.6 };
      });
      edges = [];
      const maxD = Math.max(120, Math.min(w, h) * 0.2);
      nodes.forEach((n, i) => {
        const near = nodes
          .map((m, j) => ({ j, d: Math.hypot(m.bx - n.bx, m.by - n.by) }))
          .filter((o) => o.j > i && o.d < maxD)
          .sort((p, q) => p.d - q.d)
          .slice(0, 3);
        near.forEach((o) => edges.push({ a: i, b: o.j }));
      });
      pulses = [];
    };

    const draw = (time: number) => {
      const dt = Math.min(48, time - last || 16); last = time;
      ctx.clearRect(0, 0, w, h);
      const t = time / 1000;

      nodes.forEach((n) => {
        const organic = n.bx / w < 0.58;
        const amp = organic && !reduce ? 3.2 : 0;
        n.x = n.bx + Math.sin(t * 0.35 + n.ph) * amp;
        n.y = n.by + Math.cos(t * 0.28 + n.ph) * amp;
      });

      // edges
      edges.forEach((e) => {
        const A = nodes[e.a], B = nodes[e.b];
        const mid = (A.bx + B.bx) / 2 / w;
        const md = Math.hypot((A.x + B.x) / 2 - mouse.x, (A.y + B.y) / 2 - mouse.y);
        const wake = Math.max(0, 1 - md / 220);
        const organic = mid < 0.58;
        ctx.strokeStyle = organic
          ? `rgba(255,138,91,${0.13 + wake * 0.45})`
          : `rgba(141,180,255,${0.11 + wake * 0.4})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        if (organic) {
          const cx = (A.x + B.x) / 2 + (B.y - A.y) * 0.22;
          const cy = (A.y + B.y) / 2 - (B.x - A.x) * 0.22;
          ctx.quadraticCurveTo(cx, cy, B.x, B.y);
        } else {
          ctx.lineTo(B.x, A.y); ctx.lineTo(B.x, B.y); // orthogonal routing, like a drafted diagram
        }
        ctx.stroke();
      });

      // pulses travel along edges
      if (!reduce) {
        if (pulses.length < 7 && Math.random() < 0.035) pulses.push({ e: Math.floor(Math.random() * edges.length), t: 0, v: 0.00035 + Math.random() * 0.0004 });
        pulses = pulses.filter((p) => (p.t += p.v * dt) < 1);
        pulses.forEach((p) => {
          const e = edges[p.e]; if (!e) return;
          const A = nodes[e.a], B = nodes[e.b];
          const organic = (A.bx + B.bx) / 2 / w < 0.58;
          let x: number, y: number;
          if (organic) {
            const cx = (A.x + B.x) / 2 + (B.y - A.y) * 0.22, cy = (A.y + B.y) / 2 - (B.x - A.x) * 0.22, u = 1 - p.t;
            x = u * u * A.x + 2 * u * p.t * cx + p.t * p.t * B.x;
            y = u * u * A.y + 2 * u * p.t * cy + p.t * p.t * B.y;
          } else {
            const lx = Math.abs(B.x - A.x), ly = Math.abs(B.y - A.y), L = lx + ly || 1, d = p.t * L;
            if (d < lx) { x = A.x + Math.sign(B.x - A.x) * d; y = A.y; } else { x = B.x; y = A.y + Math.sign(B.y - A.y) * (d - lx); }
          }
          const fade = Math.sin(p.t * Math.PI);
          ctx.fillStyle = organic ? `rgba(255,170,135,${0.85 * fade})` : `rgba(190,212,255,${0.85 * fade})`;
          ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
        });
      }

      // nodes
      nodes.forEach((n) => {
        const md = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        const wake = Math.max(0, 1 - md / 180);
        const organic = n.bx / w < 0.58;
        ctx.fillStyle = organic ? `rgba(255,156,121,${0.45 + wake * 0.55})` : `rgba(160,195,255,${0.45 + wake * 0.55})`;
        ctx.beginPath();
        if (organic) ctx.arc(n.x, n.y, n.r + wake * 1.6, 0, Math.PI * 2);
        else { const s = n.r + 0.6 + wake * 1.4; ctx.rect(n.x - s, n.y - s, s * 2, s * 2); }
        ctx.fill();
      });

      if (!reduce && visible) raf = requestAnimationFrame(draw);
    };

    const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
    build(); start();

    const ro = new ResizeObserver(() => { build(); start(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); });
    io.observe(canvas);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      if (reduce) start();
    };
    const onLeave = () => { mouse.x = mouse.y = -9999; };
    const onVis = () => { visible = !document.hidden; if (visible) start(); };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`block h-full w-full ${className}`} />;
}
