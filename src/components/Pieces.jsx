import { CYCLE_PHASES, highlightSegments, year } from '../lib/text.js';

export function RoleTag({ roleId, content, children }) {
  const role = content.roleById[roleId];
  if (!role) return null;
  return (
    <span className="roletag">
      <span className="dot" style={{ background: role.color }} />
      {children ?? role.name}
    </span>
  );
}

/** Year, cycle and the six steps of a cycle. */
export function PhaseTrack({ state }) {
  const inCycle = state.cycle > 0 && state.phase !== 'ended';
  const idx = CYCLE_PHASES.findIndex((p) => p.id === state.phase);
  return (
    <div className="track">
      <div className="track__year">
        <span className="track__big">{state.phase === 'vision' || state.phase === 'lobby' ? 2025 : year(state.cycle)}</span>
        <span className="track__small">
          {state.phase === 'vision' || state.phase === 'lobby' ? 'Before the first cycle' : `Cycle ${state.cycle} of ${state.cycles}`}
        </span>
      </div>
      {inCycle && (
        <ol className="track__steps" aria-label="Phases in this cycle">
          {CYCLE_PHASES.map((p, i) => (
            <li key={p.id} className={i === idx ? 'is-now' : i < idx ? 'is-done' : ''} aria-current={i === idx ? 'step' : undefined}>
              {p.label}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** A disruption card, flipped over when it first appears. */
export function DisruptionCard({ event, content, small = false }) {
  if (!event) return null;
  const ability = content.abilityById[event.abilityId];
  return (
    <article className={`storm ${small ? 'storm--small' : ''}`} key={event.id}>
      <p className="storm__kicker">New challenge</p>
      <h2 className="storm__title">{event.title}</h2>
      <p className="storm__body">{event.body}</p>
      <p className="storm__outcome">{event.outcome}</p>
      {!small && ability && <p className="storm__ability">This tests: {ability.name.toLowerCase()}</p>}
    </article>
  );
}

/** A headline from the newspaper of the year the cycle ends in. */
export function Headline({ headline }) {
  if (!headline) return null;
  return (
    <article className={`paper paper--${headline.tone}`} key={`${headline.year}-${headline.final}`}>
      <p className="paper__masthead">The Daily {headline.year}</p>
      <h2 className="paper__title">{headline.title}</h2>
      <p className="paper__sub">{headline.sub}</p>
      {headline.stories?.length > 0 && (
        <div className="paper__stories">
          {headline.stories.map((s, i) => (
            <blockquote key={i}>
              <p>{s.text}</p>
              <cite>{s.persona}</cite>
            </blockquote>
          ))}
        </div>
      )}
    </article>
  );
}

/** Card text with words that sound like a project underlined. */
export function Marked({ text, words }) {
  return (
    <>
      {highlightSegments(text, words).map((s, i) =>
        s.hit ? (
          <mark key={i} className="projectword" title="This describes a project, not everyday life">
            {s.t}
          </mark>
        ) : (
          <span key={i}>{s.t}</span>
        ),
      )}
    </>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p className="errornote" role="alert">
      {children}
    </p>
  );
}

export function Loading({ children = 'Loading the game' }) {
  return <p className="loading">{children}…</p>;
}
