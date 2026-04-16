import QuickLog from "../components/QuickLog";
import Heatmap from "../components/Heatmap";
import ConsistencyRings from "../components/ConsistencyRings";

export default function Home({ state, onToggleSupp, onTrain, onSleep }) {
  return (
    <>
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
