/** The shared measures that can change the game's outcome. */
export default function Meters({ state }) {
  const threshold = state.electionThreshold;
  return (
    <div className="meters">
      <div className="meter">
        <div className="meter__head">
          <span>Public trust</span>
          <strong>{state.trust}</strong>
        </div>
        <div className="trustbar" role="meter" aria-valuemin={0} aria-valuemax={10} aria-valuenow={state.trust} aria-label="Public trust">
          <div className="trustbar__fill" style={{ width: `${state.trust * 10}%` }} />
          {threshold != null && <div className="trustbar__line" style={{ left: `${threshold * 10}%` }} title={`Below ${threshold}, the government loses the election`} />}
        </div>
        <p className="meter__note">
          {threshold != null ? `Below ${threshold}, the government loses the election.` : 'No elections. Leaders change when they rotate.'}
        </p>
      </div>

      <div className="meter">
        <div className="meter__head">
          <span>Coordination power</span>
          <strong>{state.teeth} of 3</strong>
        </div>
        <div className="teeth" aria-hidden="true">
          {[1, 2, 3].map((k) => (
            <svg key={k} viewBox="0 0 24 28" className={k <= state.teeth ? 'on' : ''}>
              <path d="M3 2 H21 V12 C21 20, 16 26, 12 26 C8 26, 3 20, 3 12 Z" />
            </svg>
          ))}
        </div>
        <p className="meter__note">{state.teeth ? `Can take ${state.teeth} resource${state.teeth === 1 ? '' : 's'} from ministries that hold back.` : 'At 0, ministries can hold back without a cost.'}</p>
      </div>

      <div className="meter">
        <div className="meter__head">
          <span>Drift from the vision</span>
          <strong>{state.drift} of 3</strong>
        </div>
        <div className="drift" aria-hidden="true">
          {[1, 2, 3].map((k) => (
            <span key={k} className={k <= state.drift ? 'on' : ''} />
          ))}
        </div>
        <p className="meter__note">At 3, the vision becomes a list of short-term goals.</p>
      </div>
    </div>
  );
}
