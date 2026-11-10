import Plant from './Plant.jsx';

/** The whole vision as a row of plants, with what each one says beneath it. */
export default function Field({ state, content, onPick, pickLabel, compact = false, showLegend = true }) {
  const roleById = content.roleById;
  if (!state.elements.length) {
    return <p className="empty">The field is empty until the group agrees on its pictures of 2045.</p>;
  }
  return (
    <section className={`field ${compact ? 'field--compact' : ''}`} aria-label="The vision">
      <div className="field__row" style={{ '--cols': state.elements.length }}>
        {state.elements.map((e) => (
          <figure key={e.id} className={`field__item ${e.status !== 'alive' ? 'is-shelved' : ''}`}>
            <Plant element={e} roleById={roleById} compact={compact} />
            <figcaption>
              <p className="field__text">{e.text}</p>
              <p className="field__meta">
                <span className="pips" aria-label={`Health ${e.health} of 4`}>
                  {[1, 2, 3, 4].map((k) => (
                    <i key={k} className={k <= e.health ? 'on' : ''} />
                  ))}
                </span>
                {e.contributorRoles.map((r) => (
                  <span key={r} className="dot" style={{ background: roleById[r]?.color }} title={roleById[r]?.name} />
                ))}
                {e.status !== 'alive' && <span className="tag tag--bad">Shelved</span>}
                {e.status === 'alive' && e.proof && (
                  <span className="tag tag--good" title="Support from other parties, an institution, or strong public support protects it when government changes">
                    Protected
                  </span>
                )}
              </p>
              {onPick && e.status === 'alive' && (
                <button type="button" className="btn btn--small" onClick={() => onPick(e)}>
                  {pickLabel}
                </button>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
      {showLegend && <RootLegend content={content} />}
    </section>
  );
}

export function RootLegend({ content }) {
  return (
    <ul className="legend" aria-label="What the roots mean">
      {content.instruments.map((i) => (
        <li key={i.id}>
          <svg viewBox="0 0 28 10" aria-hidden="true">
            <path d="M2 5 H26" className={`legend__root legend__root--${i.id}`} />
          </svg>
          {i.name}
        </li>
      ))}
      <li>
        <svg viewBox="0 0 28 14" aria-hidden="true">
          <circle cx="9" cy="7" r="5" className="legend__pact" />
          <circle cx="17" cy="7" r="5" className="legend__pact" />
        </svg>
        Cross-party support
      </li>
      <li>
        <svg viewBox="0 0 14 18" aria-hidden="true">
          <circle cx="7" cy="4" r="3" className="legend__person" />
          <path d="M7 7 V13 M3 10 H11" className="legend__person-line" />
        </svg>
        Public support
      </li>
    </ul>
  );
}
