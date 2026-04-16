import { C } from "../constants";

export default function Header({ name, status, trainDone, sleepDone, suppsDone, complete }) {
  return (
    <div style={{ padding: "16px 14px 12px", borderBottom: `0.5px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{name}</div>
          <div className="mono" style={{ fontSize: 9, color: C.cyan, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>{status}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[{ done: trainDone, c: C.green }, { done: sleepDone, c: C.purple }, { done: suppsDone, c: C.cyan }]
            .map((x, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: x.done ? x.c : C.border, transition: "background 0.3s" }} />)}
          {complete && <span style={{ fontSize: 12, marginLeft: 2 }}>👑</span>}
        </div>
      </div>
    </div>
  );
}
