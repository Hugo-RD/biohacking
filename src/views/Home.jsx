import QuickLog from "../components/QuickLog";
import Heatmap from "../components/Heatmap";
import ConsistencyRings from "../components/ConsistencyRings";
import { C } from "../constants";

export default function Home({ state, onToggleSupp, onTrain, onSleep }) {
  const isFresh = Object.keys(state.logs || {}).length === 0;

  return (
    <>
      {isFresh && (
        <div className="card" style={{
          background: "linear-gradient(135deg, rgba(0,240,255,0.04), rgba(123,104,238,0.04))",
          borderColor: "rgba(0,240,255,0.15)",
          marginTop: 14,
        }}>
          <div className="mono" style={{ fontSize: 9, color: C.cyan, letterSpacing: 1.5, marginBottom: 6 }}>// bienvenido</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, marginBottom: 4 }}>
            registra tu primer hábito abajo.
          </div>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
            cuanto más consistente, más claro verás los patrones. un toque basta para empezar.
          </div>
        </div>
      )}

      <div className="section-label">// quick log</div>
      <QuickLog state={state} onToggleSupp={onToggleSupp} onTrain={onTrain} onSleep={onSleep} />

      <div className="section-label">// actividad</div>
      <div className="card">
        <Heatmap logs={state.logs} supps={state.supplements} />
      </div>

      <div className="section-label">// consistencia · 30 días</div>
      <ConsistencyRings state={state} />
    </>
  );
}
