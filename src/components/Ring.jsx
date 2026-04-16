import { C } from "../constants";

export default function Ring({ pct, color, size = 56, sw = 5 }) {
  const r = (size - sw) / 2;
  const ci = 2 * Math.PI * r;
  const off = ci - (pct / 100) * ci;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={ci} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
}
