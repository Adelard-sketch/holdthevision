import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiUrl } from '../lib/api.js';
import { useContent } from '../lib/content.js';
import { getToken } from '../lib/storage.js';
import { short } from '../lib/text.js';
import Radar from '../components/Radar.jsx';
import Field from '../components/Field.jsx';
import { ErrorNote, Headline, Loading, RoleTag } from '../components/Pieces.jsx';

/** After the game: what held, what broke, and which abilities to talk about. */
export default function Debrief() {
  const { code: raw } = useParams();
  const code = raw.toUpperCase();
  const hostToken = getToken('host', code);
  const { content, error: contentError } = useContent();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api(`/sessions/${code}/debrief`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [code]);

  if (!data || !content) return <Loading>{error || contentError || 'Preparing the debrief'}</Loading>;
  const { result, state, ended } = data;
  const weakest = result.weakest;
  const front = state.headlines[state.headlines.length - 1];

  return (
    <div className="debrief">
      <header className="debrief__head">
        <p className="muted">
          Debrief for room {code}, {state.packName}
        </p>
        <h1>{result.outcome.label}</h1>
        <p className="debrief__lede">{result.outcome.text}</p>
        {!ended && <p className="warn">The game is still running. These scores will change.</p>}
      </header>

      {front?.final && (
        <section className="debrief__paper">
          <Headline headline={front} />
        </section>
      )}

      <section className="debrief__abilities">
        <div className="debrief__radar">
          <Radar abilities={result.abilities} weakest={weakest} />
        </div>
        <div>
          <h2>How the group kept the vision going</h2>
          <p className="muted">
            These scores describe this game, not the whole country. Start with the two lowest scores: do they reflect
            challenges in real life?
          </p>
          <ul className="abilities">
            {result.abilities.map((a) => (
              <li key={a.id} className={weakest.includes(a.id) ? 'is-weak' : ''}>
                <div className="abilities__head">
                  <span className="abilities__name">{a.name}</span>
                  <span className="abilities__score">{a.score}</span>
                </div>
                <div className="scorebar">
                  <span style={{ width: `${a.score}%` }} />
                </div>
                <p className="abilities__ev">{a.evidence}</p>
                {weakest.includes(a.id) && (
                  <div className="prompts">
                    <p className="prompts__label">Start the conversation here</p>
                    <ul>
                      {a.prompts.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="debrief__block">
        <h2>The vision at the end</h2>
        <Field state={state} content={content} compact />
      </section>

      <section className="debrief__block">
        <h2>What happened to each part of the vision</h2>
        <HealthTimeline state={state} />
      </section>

      {result.agendas && (
        <section className="debrief__block">
          <h2>Private goals</h2>
          <p className="muted">Each role had its own goal as well as the shared vision. See which goals were met.</p>
          <ul className="agendas">
            {result.agendas.map((a) => (
              <li key={a.playerId} className={a.met ? 'is-met' : ''}>
                <RoleTag roleId={a.roleId} content={content}>
                  {a.name}
                </RoleTag>
                <span className="agendas__text">{a.agenda}</span>
                <span className={`tag ${a.met ? 'tag--good' : 'tag--bad'}`}>{a.met ? 'Met' : 'Missed'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="debrief__block">
        <h2>Timeline</h2>
        <ol className="timeline">
          {state.log.map((l, i) => (
            <li key={i} className={`timeline__item timeline__item--${l.tone}`}>
              <span className="timeline__year">{l.cycle ? 2025 + l.cycle * 5 : 2025}</span>
              <span className="timeline__ability">{content.abilityById[l.ability]?.name}</span>
              <span>{l.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="debrief__block debrief__actions">
        <h2>Save or share the results</h2>
        <p className="muted">
          Download a draft summary of the vision, how the group supported it, and questions for discussion.
        </p>
        <div className="row">
          <a className="btn btn--primary" href={apiUrl(`/sessions/${code}/export`)} download>
            Download the plan draft
          </a>
          {hostToken && (
            <a className="btn" href={apiUrl(`/sessions/${code}/log.csv`, { token: hostToken })} download>
              Download the research log
            </a>
          )}
          <Link className="btn" to="/">
            Start a new game
          </Link>
        </div>
        {hostToken && (
          <p className="small muted">
            The research log lists every move by role, with no names, so you can compare sessions when testing the
            six-ability hypotheses.
          </p>
        )}
        <ErrorNote>{error}</ErrorNote>
      </section>
    </div>
  );
}

function HealthTimeline({ state }) {
  const history = state.history.health;
  if (!history.length) return <p className="muted">No cycles were played.</p>;
  const years = history.map((_, i) => 2025 + i * 5);
  return (
    <div className="htl" role="table" aria-label="Health of each element by year">
      <div className="htl__row htl__row--head" role="row">
        <span role="columnheader">Element</span>
        {years.map((y) => (
          <span key={y} role="columnheader">
            {y}
          </span>
        ))}
      </div>
      {state.elements.map((e) => (
        <div key={e.id} className="htl__row" role="row">
          <span role="cell" className="htl__name">
            {short(e.text, 70)}
          </span>
          {history.map((snap, i) => {
            const h = snap[e.id] ?? 0;
            return (
              <span key={i} role="cell" className={`htl__cell htl__cell--${h}`} title={`Health ${h}`}>
                {h}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
