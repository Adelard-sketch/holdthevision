import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useContent } from '../lib/content.js';
import { getToken } from '../lib/storage.js';
import { useAction, useGame } from '../lib/useGame.js';
import { PHASE_HELP, PHASE_LABEL, findProjectWords, short, year } from '../lib/text.js';
import { DisruptionCard, ErrorNote, Headline, Loading, Marked, RoleTag } from '../components/Pieces.jsx';

/** A player's phone: their role, secret agenda and moves for the current phase. */
export default function Player() {
  const { code: raw } = useParams();
  const code = raw.toUpperCase();
  const token = getToken('player', code);
  const { content, error: contentError } = useContent();
  const { state, me, error, send } = useGame(code, token);

  if (!token) {
    return (
      <div className="phone phone--center">
        <h1 className="phone__title">You haven't joined room {code} on this device</h1>
        <Link className="btn btn--primary btn--wide" to={`/join/${code}`}>
          Join this game
        </Link>
      </div>
    );
  }
  if (!state || !content || !me) return <Loading>{error || contentError || 'Joining the game'}</Loading>;

  const role = content.roleById[me.roleId];
  return (
    <div className="phone" style={{ '--role': role?.color ?? '#4A5A66' }}>
      <header className="phone__head">
        <div>
          <p className="phone__role">{role ? role.name : 'No role yet'}</p>
          <p className="phone__name">
            {me.name}
            {me.isChampion && <span className="tag tag--champ">Champion</span>}
          </p>
        </div>
        {me.roleId && state.phase !== 'lobby' && (
          <div className="phone__purse">
            <strong>{me.isGov ? me.resources : me.voice}</strong>
            <span>{me.isGov ? 'resources' : 'support points'}</span>
          </div>
        )}
      </header>
      {error && <p className="banner">{error}</p>}

      {me.agenda && state.phase !== 'ended' && <SecretAgenda text={me.agenda} />}

      <div className="phone__phase">
        <p className="phone__phasename">
          {PHASE_LABEL[state.phase]}
          {state.cycle > 0 && state.phase !== 'ended' ? `, ${year(state.cycle)}` : ''}
        </p>
        <details className="howto">
          <summary>What do I do now?</summary>
          <p>{PHASE_HELP[state.phase]}</p>
        </details>
      </div>

      <PhaseBody state={state} me={me} content={content} send={send} code={code} />
    </div>
  );
}

/** Press and hold to read, so people nearby can't glance at it. */
function SecretAgenda({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      className={`agenda ${open ? 'is-open' : ''}`}
      onPointerDown={() => setOpen(true)}
      onPointerUp={() => setOpen(false)}
      onPointerLeave={() => setOpen(false)}
      onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setOpen(true)}
      onKeyUp={() => setOpen(false)}
      aria-label={open ? text : 'Secret agenda. Press and hold to read.'}
    >
      <span className="agenda__label">Your secret agenda</span>
      <span className="agenda__text">{open ? text : 'Press and hold to read'}</span>
    </button>
  );
}

function PhaseBody({ state, me, content, send, code }) {
  switch (state.phase) {
    case 'lobby':
      return <RolePicker state={state} me={me} content={content} send={send} />;
    case 'vision':
      return <VisionPhone state={state} me={me} content={content} send={send} />;
    case 'disruption':
      return <DisruptionCard event={state.event} content={content} small />;
    case 'budget':
      return me.roleId === 'finance' ? (
        <BudgetPhone state={state} me={me} content={content} send={send} />
      ) : (
        <Waiting>
          {state.budget.allocations
            ? `Finance gave you ${state.budget.allocations[me.id] ?? 0}.`
            : `The Ministry of Finance is splitting a pool of ${state.budget.pool}.`}
        </Waiting>
      );
    case 'anchor':
      return <AnchorPhone state={state} me={me} content={content} send={send} />;
    case 'coordinate':
      return me.isGov ? (
        <CoordinatePhone state={state} me={me} send={send} />
      ) : (
        <Waiting>Ministries are privately choosing whether to work together or hold back. The shared screen will show the result.</Waiting>
      );
    case 'win':
      return me.roleId === 'hog' ? (
        <WinPhone state={state} send={send} />
      ) : (
        <Waiting>The Head of Government's Office is choosing what to show voters.</Waiting>
      );
    case 'succession':
      return (
        <div className="stack">
          <Headline headline={state.headlines[state.headlines.length - 1]} />
          <ul className="report">
            {state.succession?.report.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      );
    case 'ended':
      return <EndedPhone state={state} me={me} code={code} />;
    default:
      return null;
  }
}

function Waiting({ children }) {
  return <p className="waiting">{children}</p>;
}

function Done({ me, send, label = 'I\'m done for this phase' }) {
  const { run, busy, error } = useAction();
  if (me.ready) return <p className="ok">You're marked as done. You can still make moves until the facilitator moves on.</p>;
  return (
    <>
      <ErrorNote>{error}</ErrorNote>
      <button type="button" className="btn btn--wide" disabled={busy} onClick={() => run(() => send('done'))}>
        {label}
      </button>
    </>
  );
}

// ---------------------------------------------------------------------------

function RolePicker({ state, me, content, send }) {
  const { run, error } = useAction();
  const takenBy = Object.fromEntries(state.players.filter((p) => p.roleId).map((p) => [p.roleId, p]));
  return (
    <section className="stack">
      <h2 className="phone__h">Pick who you'll play</h2>
      <p className="muted small">Choose a role. You can try one different from your everyday work.</p>
      <div className="roles">
        {content.roles.map((r) => {
          const holder = takenBy[r.id];
          const mine = me.roleId === r.id;
          return (
            <button
              type="button"
              key={r.id}
              className={`rolecard ${mine ? 'is-mine' : ''} ${holder && !mine ? 'is-taken' : ''}`}
              style={{ '--c': r.color }}
              onClick={() => !mine && run(() => send('choose_role', { roleId: r.id }))}
              aria-pressed={mine}
            >
              <span className="rolecard__name">{r.name}</span>
              <span className="rolecard__desc">{holder && !mine ? `Taken by ${holder.name}` : r.description}</span>
              <span className="rolecard__kind">{r.is_government ? 'Inside government' : 'Outside government'}</span>
            </button>
          );
        })}
      </div>
      <ErrorNote>{error}</ErrorNote>
      <p className="muted small">The facilitator starts the game when everyone is in.</p>
    </section>
  );
}

// ---------------------------------------------------------------------------

function VisionPhone({ state, me, content, send }) {
  const [text, setText] = useState('');
  const [rewriting, setRewriting] = useState(null);
  const [showExample, setShowExample] = useState(false);
  const write = useAction();
  const vote = useAction();
  const reroll = useAction();
  const hits = findProjectWords(text, content.projectWords);
  const myCards = state.cards.filter((c) => me.myCards.includes(c.id));
  const toVote = state.cards.filter((c) => c.status === 'voting' && !me.myCards.includes(c.id) && !me.myVotes[c.id]);
  const canWrite = me.myCards.length < 2 || rewriting;
  const example = useMemo(() => content.examples[Math.floor(Math.random() * content.examples.length)], [content]);

  async function submit(e) {
    e.preventDefault();
    if (text.trim().length < 15) {
      write.setError('Write at least a full sentence about one moment in 2045.');
      return;
    }
    const ok = await write.run(() => send('submit_card', rewriting ? { text, cardId: rewriting } : { text }));
    if (ok) {
      setText('');
      setRewriting(null);
    }
  }

  return (
    <div className="stack">
      {canWrite && me.prompt && (
        <form className="prompt" onSubmit={submit}>
          <p className="prompt__label">{rewriting ? 'Rewrite this as a moment in someone’s life' : 'Imagine everyday life in 2045 for'}</p>
          <p className="prompt__who">{me.prompt.persona}</p>
          <p className="prompt__domain">{me.prompt.domain}</p>
          <label className="sr-only" htmlFor="card">
            Your card
          </label>
          <textarea
            id="card"
            rows={4}
            maxLength={280}
            value={text}
            placeholder="For example: I can get to work safely, even in the rain."
            onChange={(e) => {
              setText(e.target.value);
              write.setError(null);
            }}
          />
          <div className="prompt__meter">
            <span className={hits.length ? 'warn' : 'muted'}>
              {hits.length
                ? `"${hits[0]}" sounds like a project. Describe what this person's everyday life is like instead.`
                : 'Describe what this person sees, does, or feels—not what the government will build or launch.'}
            </span>
            <span className="muted">{280 - text.length}</span>
          </div>
          <ErrorNote>{write.error}</ErrorNote>
          <div className="row">
            <button type="submit" className="btn btn--primary" disabled={write.busy}>
              {rewriting ? 'Send the rewrite' : 'Add to the wall'}
            </button>
            {!rewriting && (
              <button type="button" className="btn" disabled={reroll.busy} onClick={() => reroll.run(() => send('reroll'))}>
                Different person
              </button>
            )}
          </div>
          <button type="button" className="linkbtn" onClick={() => setShowExample((v) => !v)}>
            {showExample ? 'Hide the example' : 'Show me an example'}
          </button>
          {showExample && example && <p className="example">{example.text}</p>}
        </form>
      )}

      {myCards.length > 0 && (
        <section>
          <h2 className="phone__h">Your cards</h2>
          <ul className="mycards">
            {myCards.map((c) => (
              <li key={c.id} className={`mycard mycard--${c.status}`}>
                <p className="mycard__text">{c.text}</p>
                <p className="mycard__status">
                  {
                    {
                      voting: `Voting: ${c.life} life, ${c.project} project`,
                      accepted: 'Voted into the vision',
                      returned: 'Sent back as a project',
                      rejected: 'Left out',
                      overflow: 'Didn\'t make the final six',
                    }[c.status]
                  }
                </p>
                {c.status === 'returned' && c.rewrites === 0 && rewriting !== c.id && (
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => {
                      setRewriting(c.id);
                      setText('');
                    }}
                  >
                    Rewrite it
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="phone__h">{toVote.length ? `Vote on ${toVote.length} card${toVote.length > 1 ? 's' : ''}` : 'Nothing to vote on right now'}</h2>
        {toVote.slice(0, 1).map((c) => (
          <article key={c.id} className="votecard">
            <p className="votecard__who">{c.persona}</p>
            <p className="votecard__text">
              <Marked text={c.text} words={content.projectWords} />
            </p>
            <ErrorNote>{vote.error}</ErrorNote>
            <div className="votecard__buttons">
              <button type="button" className="btn btn--life" disabled={vote.busy} onClick={() => vote.run(() => send('vote', { cardId: c.id, vote: 'life' }))}>
                Sounds like a person’s life
              </button>
              <button
                type="button"
                className="btn btn--project"
                disabled={vote.busy}
                onClick={() => vote.run(() => send('vote', { cardId: c.id, vote: 'project' }))}
              >
                Sounds like a project
              </button>
            </div>
          </article>
        ))}
        {!toVote.length && <p className="muted small">New cards appear here as people write them.</p>}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function BudgetPhone({ state, me, content, send }) {
  const gov = state.players.filter((p) => p.isGov);
  const [alloc, setAlloc] = useState(() => Object.fromEntries(gov.map((p) => [p.id, 0])));
  const { run, busy, error } = useAction();
  const used = Object.values(alloc).reduce((a, b) => a + b, 0);
  const left = state.budget.pool - used;

  if (state.budget.allocations) {
    return <p className="ok">You shared the budget. Ministries can now spend their resources to protect the vision.</p>;
  }
  const bump = (pid, d) => setAlloc((a) => ({ ...a, [pid]: Math.max(0, a[pid] + d) }));
  return (
    <section className="stack">
      <h2 className="phone__h">Share the budget</h2>
      <p className="muted small">
        {state.budget.committed > 0 && `${state.budget.committed} is already promised for existing plans. `}
        Give money to ministries. Your ministry can also keep some to spend.
      </p>
      <p className={`bigleft ${left < 0 ? 'warn' : ''}`}>{left} left to give</p>
      <ul className="steppers">
        {gov.map((p) => (
          <li key={p.id}>
            <RoleTag roleId={p.roleId} content={content}>
              {p.id === me.id ? 'Your ministry' : content.roleById[p.roleId].name}
            </RoleTag>
            <div className="stepper">
              <button type="button" aria-label={`Less for ${p.name}`} onClick={() => bump(p.id, -1)}>
                −
              </button>
              <span>{alloc[p.id]}</span>
              <button type="button" aria-label={`More for ${p.name}`} onClick={() => left > 0 && bump(p.id, 1)}>
                +
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ErrorNote>{error}</ErrorNote>
      <button type="button" className="btn btn--primary btn--wide" disabled={busy} onClick={() => run(() => send('allocate', { allocations: alloc }))}>
        Hand out the budget
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------

function AnchorPhone({ state, me, content, send }) {
  const { run, busy, error } = useAction();
  const alive = state.elements.filter((e) => e.status === 'alive');
  const isGov = me.isGov;

  if (!isGov && !me.endorsing) {
    return (
      <Waiting>
        Your group withdrew its endorsement because none of its input survives in the vision. You can watch, but you won't
        mobilise for it.
      </Waiting>
    );
  }
  return (
    <section className="stack">
      <h2 className="phone__h">{isGov ? 'Protect parts of the vision' : 'Build support for the vision'}</h2>
      <p className="muted small">
        {isGov
          ? `You have ${me.resources} resource${me.resources === 1 ? '' : 's'}. A progress target tracks change. Funding, a law, or an institution helps a vision card last. An institution also protects it when the government changes.`
          : `You have ${me.voice} support point${me.voice === 1 ? '' : 's'}. Use them to build public support or support across parties. Strong support helps a vision card survive a change of government.`}
      </p>
      <ErrorNote>{error}</ErrorNote>
      <ul className="anchors">
        {alive.map((e) => {
          const has = new Set(e.anchors.map((a) => a.type));
          return (
            <li key={e.id} className="anchorcard">
              <p className="anchorcard__text">{short(e.text, 110)}</p>
              <p className="anchorcard__meta">
                <span className="pips">
                  {[1, 2, 3, 4].map((k) => (
                    <i key={k} className={k <= e.health ? 'on' : ''} />
                  ))}
                </span>
                {e.salience > 0 && <span className="tag">Public support {e.salience}</span>}
                {e.crossParty && <span className="tag tag--good">Cross-party</span>}
              </p>
              <div className="anchorcard__actions">
                {isGov
                  ? content.instruments.map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        className={`chip ${has.has(i.id) ? 'is-set' : ''} ${me.resources < i.cost ? 'is-dear' : ''}`}
                        disabled={busy}
                        aria-pressed={has.has(i.id)}
                        onClick={() => !has.has(i.id) && run(() => send('anchor', { elementId: e.id, instrument: i.id }))}
                        title={i.description}
                      >
                        {i.name} <span className="chip__cost">{has.has(i.id) ? 'in place' : `${i.cost} resources`}</span>
                      </button>
                    ))
                  : (
                    <>
                      <button type="button" className="chip" disabled={busy} onClick={() => run(() => send('mobilize', { elementId: e.id }))}>
                        Build public support <span className="chip__cost">1 point</span>
                      </button>
                      {!e.crossParty && (
                        <button type="button" className="chip" disabled={busy} onClick={() => run(() => send('broker', { elementId: e.id }))}>
                          Build cross-party support <span className="chip__cost">{me.brokerCost} points</span>
                        </button>
                      )}
                    </>
                  )}
              </div>
            </li>
          );
        })}
      </ul>
      {isGov && (
        <div className="teethbox">
          <p>
            <strong>Give the coordinating body more power.</strong> Spend 2 resources so it can take resources from
            ministries that hold back. Current power: {state.teeth} of 3.
          </p>
          <button type="button" className="btn" disabled={busy} onClick={() => run(() => send('give_teeth'))}>
            Increase its power
          </button>
        </div>
      )}
      <Done me={me} send={send} />
    </section>
  );
}

// ---------------------------------------------------------------------------

function CoordinatePhone({ state, me, send }) {
  const { run, busy, error } = useAction();
  const choice = me.myChoice;
  return (
    <section className="stack">
      <h2 className="phone__h">Work together or hold back?</h2>
      <p className="muted small">
        {state.coordinationNeeded} ministries must choose “work together” for the two weakest vision cards to grow. Your choice stays private until the reveal.
      </p>
      <div className="dilemma">
        <button type="button" className={`dilemma__opt ${choice === 'align' ? 'is-chosen' : ''}`} disabled={busy} onClick={() => run(() => send('coordinate', { choice: 'align' }))}>
          <span className="dilemma__name">Work together</span>
          <span className="dilemma__cost">Costs 1 resource and helps the group reach its goal.</span>
        </button>
        <button type="button" className={`dilemma__opt ${choice === 'hold' ? 'is-chosen' : ''}`} disabled={busy} onClick={() => run(() => send('coordinate', { choice: 'hold' }))}>
          <span className="dilemma__name">Hold back</span>
          <span className="dilemma__cost">
            {state.teeth ? `Gain 1 resource. The coordinating body may take ${state.teeth} back.` : 'Gain 1 resource. The coordinating body has no power to stop you.'}
          </span>
        </button>
      </div>
      <ErrorNote>{error}</ErrorNote>
      {choice && <p className="ok">You chose to {choice === 'align' ? 'work together' : 'hold back'}. You can change your choice until the reveal.</p>}
    </section>
  );
}

function WinPhone({ state, send }) {
  const { run, busy, error } = useAction();
  return (
    <section className="stack">
      <h2 className="phone__h">What will you show voters?</h2>
      <p className="muted small">
        Showing progress on the vision earns 1 trust. A ribbon earns 2 trust but adds drift. Showing nothing loses 2 trust.
      </p>
      <ul className="options">
        {state.win.options.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              className={`option option--${o.kind} ${state.win.choice === o.id ? 'is-chosen' : ''}`}
              disabled={busy}
              onClick={() => run(() => send('choose_win', { optionId: o.id }))}
            >
              <span className="option__kind">{{ linked: 'Progress on the vision, trust +1', ribbon: 'A ribbon, trust +2, drift +1', none: 'Nothing, trust −2' }[o.kind]}</span>
              <span>{o.kind === 'linked' ? short(o.title.replace(/^Report progress on /, ''), 90) : o.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <ErrorNote>{error}</ErrorNote>
    </section>
  );
}

function EndedPhone({ state, me, code }) {
  const mine = state.result?.agendas?.find((a) => a.playerId === me.id);
  return (
    <section className="stack">
      <Headline headline={state.headlines[state.headlines.length - 1]} />
      {state.result && (
        <p className="outcome">
          <strong>{state.result.outcome.label}.</strong>
        </p>
      )}
      {mine && (
        <div className={mine.met ? 'ok' : 'warn'}>
          <p className="small">Your secret agenda</p>
          <p>{mine.agenda}</p>
          <p>
            <strong>{mine.met ? 'You managed it.' : 'You didn\'t manage it.'}</strong>
          </p>
        </div>
      )}
      <Link className="btn btn--primary btn--wide" to={`/debrief/${code}`}>
        Open the debrief
      </Link>
    </section>
  );
}
