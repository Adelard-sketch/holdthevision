import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useContent } from '../lib/content.js';
import { getToken } from '../lib/storage.js';
import { useAction, useGame } from '../lib/useGame.js';
import { PHASE_HELP, PHASE_LABEL, CYCLE_PHASES, year, short } from '../lib/text.js';
import Field from '../components/Field.jsx';
import Meters from '../components/Meters.jsx';
import { DisruptionCard, ErrorNote, Headline, Loading, Marked, PhaseTrack, RoleTag } from '../components/Pieces.jsx';

/** The shared screen: projected in the room or shared on a call. */
export default function Host() {
  const { code: raw } = useParams();
  const code = raw.toUpperCase();
  const token = getToken('host', code);
  const { content, error: contentError } = useContent();
  const { state, error, send } = useGame(code, token);

  if (!token) {
    return (
      <div className="phone phone--center">
        <h1 className="phone__title">This screen is for the facilitator</h1>
        <p className="muted">This room is controlled from the facilitator’s device. To play, join from your phone.</p>
        <Link className="btn btn--primary" to={`/join/${code}`}>
          Join as a player
        </Link>
      </div>
    );
  }
  if (!state || !content) return <Loading>{error || contentError || 'Loading the game'}</Loading>;

  return (
    <div className={`host host--${state.phase}`}>
      <header className="hostbar">
        <div className="hostbar__name">
          <p className="hostbar__vision">{state.visionName}</p>
          <p className="hostbar__pack">
            {state.packName}
            {!state.nameIntact && <span className="tag tag--bad">Renamed from {state.originalName}</span>}
          </p>
        </div>
        <PhaseTrack state={state} />
        <div className="hostbar__room">
          <span className="muted small">Room</span>
          <strong className="codechip">{code}</strong>
        </div>
      </header>
      {error && <p className="banner">{error}</p>}

      {state.phase === 'lobby' ? (
        <Lobby state={state} content={content} code={code} send={send} />
      ) : (
        <Board state={state} content={content} code={code} send={send} />
      )}
    </div>
  );
}

function joinUrl(code) {
  return `${window.location.href.split('#')[0]}#/join/${code}`;
}

function Lobby({ state, content, code, send }) {
  const [fillBots, setFillBots] = useState(true);
  const start = useAction();
  const url = joinUrl(code);
  const humans = state.players.filter((p) => !p.isBot);
  const local = /localhost|127\.0\.0\.1/.test(window.location.hostname);

  return (
    <main className="lobby">
      <section className="lobby__join">
        <div className="qr">
          <QRCodeSVG value={url} size={220} marginSize={1} bgColor="#F6F8F8" fgColor="#1D2B36" title="Scan to join" />
        </div>
        <div>
          <p className="lobby__code">{code}</p>
          <p className="muted">
          Scan this code, or open <span className="url">{url}</span> on your phone.
          </p>
          {local && (
            <p className="small warn">
              Phones can't reach "localhost". Open this page using your computer's network address instead, for
              example {window.location.href.split('#')[0].replace(window.location.hostname, '192.168.1.20')}, so the
              code works for others on the same Wi-Fi.
            </p>
          )}
        </div>
      </section>

      <section className="lobby__people">
        <h2>{humans.length ? `${humans.length} joined` : 'Waiting for players'}</h2>
        <ul className="people">
          {humans.map((p) => (
            <li key={p.id}>
              <span className="people__name">{p.name}</span>
              {p.roleId ? <RoleTag roleId={p.roleId} content={content} /> : <span className="muted small">Choosing a role</span>}
            </li>
          ))}
        </ul>
        <label className="check">
          <input type="checkbox" checked={fillBots} onChange={(e) => setFillBots(e.target.checked)} />
          Fill empty seats with computer players
        </label>
        <p className="small muted">Computer players fill empty roles so you can start with fewer people.</p>
        <ErrorNote>{start.error}</ErrorNote>
        <button
          type="button"
          className="btn btn--primary btn--big"
          disabled={start.busy}
          onClick={() => start.run(() => send('start_game', { fillBots }))}
        >
          Start the game
        </button>
      </section>
    </main>
  );
}

function nextLabel(state) {
  if (state.phase === 'vision') return 'Close voting and begin 2030';
  if (state.phase === 'succession') {
    const over = state.cycle >= state.cycles || state.drift >= 3 || !state.elements.some((e) => e.status === 'alive');
    return over ? 'Reveal 2045' : `Begin ${year(state.cycle + 1)}`;
  }
  const idx = CYCLE_PHASES.findIndex((p) => p.id === state.phase);
  return `Next: ${CYCLE_PHASES[idx + 1].label}`;
}

function Board({ state, content, code, send }) {
  const advance = useAction();
  const navigate = useNavigate();
  const waitingOn = playersExpected(state).filter((p) => !p.ready);

  return (
    <>
      <main className="board">
        <div className="board__main">
          {state.phase === 'vision' ? <VisionWall state={state} content={content} /> : <Field state={state} content={content} />}
          <PhasePanel state={state} content={content} />
        </div>
        <aside className="board__side">
          {state.phase !== 'vision' && <Meters state={state} />}
          <PlayersList state={state} content={content} />
          <LogFeed state={state} content={content} />
        </aside>
      </main>

      <footer className="controls">
        <div className="controls__help">
          <strong>{PHASE_LABEL[state.phase]}.</strong> {PHASE_HELP[state.phase]}
          {waitingOn.length > 0 && state.phase !== 'ended' && (
            <span className="controls__waiting"> Waiting on {waitingOn.map((p) => p.name).join(', ')}.</span>
          )}
        </div>
        <ErrorNote>{advance.error}</ErrorNote>
        {state.phase === 'ended' ? (
          <button type="button" className="btn btn--primary btn--big" onClick={() => navigate(`/debrief/${code}`)}>
            Open the debrief
          </button>
        ) : (
          <button type="button" className="btn btn--primary btn--big" disabled={advance.busy} onClick={() => advance.run(() => send('advance'))}>
            {nextLabel(state)}
          </button>
        )}
      </footer>
    </>
  );
}

/** Which players the facilitator might want to wait for in this phase. */
function playersExpected(state) {
  const humans = state.players.filter((p) => !p.isBot);
  switch (state.phase) {
    case 'budget':
      return humans.filter((p) => p.roleId === 'finance');
    case 'anchor':
      return humans;
    case 'coordinate':
      return humans.filter((p) => p.isGov);
    case 'win':
      return humans.filter((p) => p.roleId === 'hog');
    default:
      return [];
  }
}

function VisionWall({ state, content }) {
  const accepted = state.cards.filter((c) => c.status === 'accepted').length;
  if (!state.cards.length) {
    return (
      <section className="wall wall--empty">
        <p className="wall__invite">Imagine everyday life in 2045.</p>
        <p className="muted">Players write cards on their phones. The group votes on each one; authors stay anonymous.</p>
      </section>
    );
  }
  return (
    <section className="wall" aria-label="Pictures of 2045">
      <p className="wall__count">
        {accepted} cards are in the vision so far. The six most supported cards will make up the vision.
      </p>
      <div className="wall__grid">
        {state.cards.map((c) => {
          const total = c.life + c.project || 1;
          return (
            <article key={c.id} className={`card card--${c.status}`}>
              <p className="card__who">
                {c.persona}
                {c.domainId && content.domains[c.domainId] ? `, ${content.domains[c.domainId].toLowerCase()}` : ''}
              </p>
              <p className="card__text">
                <Marked text={c.text} words={content.projectWords} />
              </p>
              <div className="votebar" aria-label={`${c.life} say life in 2045, ${c.project} say project`}>
                <span className="votebar__life" style={{ width: `${(c.life / total) * 100}%` }} />
                <span className="votebar__project" style={{ width: `${(c.project / total) * 100}%` }} />
              </div>
              <p className="card__status">
                {
                  {
                    voting: `${c.life} life, ${c.project} project`,
                    accepted: 'In the vision',
                    returned: 'Sent back to be rewritten',
                    rejected: 'Left out',
                    overflow: 'Didn\'t make the final six',
                  }[c.status]
                }
                {c.rewrites > 0 && c.status !== 'returned' ? ', rewritten' : ''}
                {c.authorRole && <RoleTag roleId={c.authorRole} content={content} />}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PhasePanel({ state, content }) {
  const latest = state.headlines[state.headlines.length - 1];
  switch (state.phase) {
    case 'disruption':
      return <DisruptionCard event={state.event} content={content} />;
    case 'budget':
      return <BudgetView state={state} content={content} />;
    case 'anchor':
      return (
        <section className="stage">
          <h2 className="stage__title">Protect the vision</h2>
          <p className="muted">Funding, laws, and institutions help vision cards last. Cards without protection can weaken at the end of a cycle.</p>
          <ul className="feed">
            {state.log
              .filter((l) => l.cycle === state.cycle && l.phase === 'anchor')
              .slice(-8)
              .map((l, i) => (
                <li key={i} className={`feed__item feed__item--${l.tone}`}>
                  {l.text}
                </li>
              ))}
          </ul>
        </section>
      );
    case 'coordinate':
      return <CoordinateView state={state} content={content} />;
    case 'win':
      return <WinView state={state} content={content} />;
    case 'succession':
      return (
        <section className="stage stage--paper">
          <Headline headline={latest} />
          <ul className="report">
            {state.win?.result && <li>{state.win.result}</li>}
            {state.succession?.report.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      );
    case 'ended':
      return (
        <section className="stage stage--paper">
          <Headline headline={latest} />
          {state.result && (
            <p className="outcome">
              <strong>{state.result.outcome.label}.</strong> {state.result.outcome.text}
            </p>
          )}
        </section>
      );
    default:
      return null;
  }
}

function BudgetView({ state, content }) {
  const b = state.budget;
  const byId = Object.fromEntries(state.players.map((p) => [p.id, p]));
  return (
    <section className="stage">
      <h2 className="stage__title">The budget</h2>
      <div className="budget">
        <div className="budget__pool">
          <span className="budget__num">{b.pool}</span>
          <span className="muted">to hand out</span>
        </div>
        <div className="budget__pool">
          <span className="budget__num budget__num--committed">{b.committed}</span>
          <span className="muted">already committed to budget lines</span>
        </div>
      </div>
      {b.allocations ? (
        <ul className="alloc">
          {Object.entries(b.allocations).map(([pid, n]) => (
            <li key={pid}>
              <RoleTag roleId={byId[pid]?.roleId} content={content} />
              <strong>+{n}</strong>
            </li>
          ))}
          {b.automatic && <li className="muted small">Finance didn't decide in time, so the pool was split evenly.</li>}
        </ul>
      ) : (
        <p className="muted">The Ministry of Finance is deciding how to split the pool.</p>
      )}
    </section>
  );
}

function CoordinateView({ state, content }) {
  const c = state.coordination;
  const gov = state.players.filter((p) => p.isGov);
  return (
    <section className="stage">
      <h2 className="stage__title">Work together</h2>
      <p className="muted">
        Ministries choose in secret. {state.coordinationNeeded} of {gov.length} must work together for the two weakest vision cards to grow.
      </p>
      <div className="seats">
        {gov.map((p) => (
          <div key={p.id} className={`seat ${c.submitted?.includes(p.id) ? 'is-in' : ''}`}>
            <RoleTag roleId={p.roleId} content={content} />
            <span className="seat__state">{c.submitted?.includes(p.id) ? 'Chosen' : 'Thinking'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function WinView({ state, content }) {
  const c = state.coordination;
  const byId = Object.fromEntries(state.players.map((p) => [p.id, p]));
  return (
    <section className="stage">
      {c?.result && (
        <>
          <h2 className="stage__title">{c.result.success ? 'The ministries delivered together' : 'The committee met and nothing moved'}</h2>
          <div className="seats seats--reveal">
            {Object.entries(c.choices).map(([pid, choice]) => (
              <div key={pid} className={`seat seat--${choice}`}>
                <RoleTag roleId={byId[pid]?.roleId} content={content} />
                <span className="seat__state">{choice === 'align' ? 'Worked together' : 'Held back'}</span>
              </div>
            ))}
          </div>
          <p className="muted">
            {c.result.aligned} worked together; {c.result.needed} were needed.
          </p>
        </>
      )}
      <h3 className="stage__sub">What will the government show voters before {year(state.cycle)}?</h3>
      <ul className="options">
        {state.win.options.map((o) => (
          <li key={o.id} className={`option option--${o.kind} ${state.win.choice === o.id ? 'is-chosen' : ''}`}>
            <span className="option__kind">{{ linked: 'Progress on the vision', ribbon: 'A ribbon', none: 'Nothing' }[o.kind]}</span>
            <span>{o.kind === 'linked' ? short(o.title.replace(/^Report progress on /, ''), 90) : o.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlayersList({ state, content }) {
  return (
    <section className="side-block">
      <h2 className="side-title">At the table</h2>
      <ul className="table-list">
        {state.players.map((p) => (
          <li key={p.id} className={p.endorsing ? '' : 'is-out'}>
            <span className="dot" style={{ background: content.roleById[p.roleId]?.color }} />
            <span className="table-list__who">
              <span className="table-list__name">
                {p.name}
                {state.championId === p.id && <span className="tag tag--champ">Champion</span>}
              </span>
              <span className="table-list__role">{content.roleById[p.roleId]?.name}</span>
            </span>
            <span className="table-list__res" title={p.isGov ? 'Resources' : 'Support points'}>
              {p.isGov ? `${p.resources} resources` : p.endorsing ? `${p.voice} support` : 'Withdrew support'}
            </span>
            <span className={`tick ${p.ready ? 'on' : ''}`} aria-label={p.ready ? 'Ready' : 'Not ready'} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function LogFeed({ state, content }) {
  const recent = state.log.slice(-4).reverse();
  if (!recent.length) return null;
  return (
    <section className="side-block">
      <h2 className="side-title">What just happened</h2>
      <ul className="feed feed--side">
        {recent.map((l, i) => (
          <li key={i} className={`feed__item feed__item--${l.tone}`}>
            <span className="feed__ability">{content.abilityById[l.ability]?.name}</span>
            {l.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
