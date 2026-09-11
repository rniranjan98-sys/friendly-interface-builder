import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-side hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: ClockPage,
});

/** Smoothly advances a single numeric value towards its target. */
function useSmooth(value: number) {
  const [display, setDisplay] = useState(value);
  const raf = useRef<number>(0);

  useEffect(() => {
    let mounted = true;
    const step = () => {
      setDisplay((prev) => {
        const diff = value - prev;
        if (Math.abs(diff) < 0.0001) return value;
        if (mounted) raf.current = requestAnimationFrame(step);
        return prev + diff * 0.35;
      });
    };
    step();
    return () => {
      mounted = false;
      cancelAnimationFrame(raf.current);
    };
  }, [value]);

  return display;
}

function AnalogClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = now.getHours() % 12 + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const minutes = now.getMinutes() + now.getSeconds() / 60;

  const smoothHours = useSmooth(hours);
  const smoothMinutes = useSmooth(minutes);
  const smoothSeconds = useSmooth(now.getSeconds() + now.getMilliseconds() / 1000);

  const R = 130;
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const major = i % 5 === 0;
    const angle = (i * 6 * Math.PI) / 180;
    const outerR = R;
    const innerR = major ? R - 14 : R - 8;
    return (
      <line
        key={i}
        x1={150 + innerR * Math.sin(angle)}
        y1={150 - innerR * Math.cos(angle)}
        x2={150 + outerR * Math.sin(angle)}
        y2={150 - outerR * Math.cos(angle)}
        stroke="#1f2937"
        strokeWidth={major ? 3 : 1.5}
        strokeLinecap="round"
      />
    );
  });

  const numerals = Array.from({ length: 12 }, (_, i) => {
    const n = i === 0 ? 12 : i;
    const angle = ((i + 1) * 30 * Math.PI) / 180;
    const r = R - 34;
    return (
      <text
        key={n}
        x={150 + r * Math.sin(angle)}
        y={150 - r * Math.cos(angle) + 6}
        textAnchor="middle"
        fontSize="16"
        fontWeight={600}
        fill="#374151"
      >
        {n}
      </text>
    );
  });

  return (
    <svg viewBox="0 0 300 300" width={260} height={260}>
      {/* Face ring */}
      <circle cx={150} cy={150} r={R + 12} fill="white" />
      <circle cx={150} cy={150} r={R + 12} fill="none" stroke="#1f2937" strokeWidth={4} />

      {ticks}
      {numerals}

      {/* Hour hand */}
      <g transform={`rotate(${smoothHours * 30} 150 150)`}>
        <line x1={150} y1={165} x2={150} y2={85} stroke="#111827" strokeWidth={5} strokeLinecap="round" />
      </g>
      {/* Minute hand */}
      <g transform={`rotate(${smoothMinutes * 6} 150 150)`}>
        <line x1={150} y1={168} x2={150} y2={55} stroke="#111827" strokeWidth={3} strokeLinecap="round" />
      </g>
      {/* Second hand */}
      <g transform={`rotate(${smoothSeconds * 6} 150 150)`}>
        <line x1={150} y1={172} x2={150} y2={40} stroke="#dc2626" strokeWidth={1.5} strokeLinecap="round" />
        <line x1={150} y1={172} x2={150} y2={160} stroke="#dc2626" strokeWidth={4} strokeLinecap="round" />
      </g>

      {/* Center dot */}
      <circle cx={150} cy={150} r={6} fill="#111827" />
      <circle cx={150} cy={150} r={2.5} fill="white" />
    </svg>
  );
}

function DigitalTime() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-10 flex flex-col items-center gap-1">
      <span className="font-mono text-5xl font-semibold tabular-nums tracking-tight text-neutral-900">
        {format(now, "HH:mm:ss")}
      </span>
      <span className="text-sm uppercase tracking-[0.25em] text-neutral-500">{format(now, "EEEE")}</span>
      <span className="text-base text-neutral-600">{format(now, "MMMM d, yyyy")}</span>
    </div>
  );
}

function ClockPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#fcfbf8" }}
    >
      <AnalogClock />
      <DigitalTime />
    </div>
  );
}
