import { C } from "../constants";
import { IconHome, IconStats, IconConfig } from "./Icons";

const TABS = [
  { id: "home", Icon: IconHome, label: "home" },
  { id: "stats", Icon: IconStats, label: "stats" },
  { id: "config", Icon: IconConfig, label: "config" },
];

export default function Nav({ view, setView }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480, background: "rgba(8,8,15,0.95)",
      borderTop: `0.5px solid ${C.border}`, display: "flex", justifyContent: "space-around",
      padding: "6px 0 12px", backdropFilter: "blur(20px)", zIndex: 100,
    }}>
      {TABS.map(n =>
        <div key={n.id} onClick={() => setView(n.id)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          cursor: "pointer", padding: "3px 16px", opacity: view === n.id ? 1 : 0.3, transition: "all 0.2s",
        }}>
          <n.Icon size={20} color={view === n.id ? C.cyan : C.muted} />
          <span className="mono" style={{ fontSize: 7, letterSpacing: 1, color: view === n.id ? C.cyan : C.dim }}>{n.label}</span>
        </div>
      )}
    </div>
  );
}
