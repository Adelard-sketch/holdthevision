import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useContent } from '../lib/content.js';
import { setToken } from '../lib/storage.js';
import { useAction } from '../lib/useGame.js';
import { ErrorNote, Loading } from '../components/Pieces.jsx';
import sdgsLogo from '../images/sdgsLogo.jpg';
import gcsiLogo from '../images/gcsi_logo.png';
import meltonLogo from '../images/melton_logo.png';

export default function Home() {
  const navigate = useNavigate();
  const { content, error: contentError } = useContent();
  const [visionName, setVisionName] = useState('Vision 2045');
  const [packId, setPackId] = useState('electoral');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const host = useAction();
  const join = useAction();

  async function create(demo) {
    await host.run(async () => {
      const s = await api('/sessions', { method: 'POST', body: { visionName, packId } });
      setToken('host', s.code, s.hostToken);
      if (demo) {
        await api(`/sessions/${s.code}/actions`, {
          method: 'POST',
          token: s.hostToken,
          body: { type: 'start_game', payload: { fillBots: true } },
        });
      }
      navigate(`/host/${s.code}`);
    });
  }

  async function joinGame(e) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length !== 5) {
      join.setError('Room codes are 5 characters. Check the shared screen.');
      return;
    }
    if (!name.trim()) {
      join.setError('Enter your name so others know who you are.');
      return;
    }
    await join.run(async () => {
      const p = await api(`/sessions/${c}/join`, { method: 'POST', body: { name } });
      setToken('player', c, p.playerToken);
      navigate(`/play/${c}`);
    });
  }

  return (
    <div className="home">
      <header className="home__top">
        <img src={gcsiLogo} alt="Government Council for Social Innovation" className="home__logo" />
        <p className="home__top-lede">
          Work together to imagine everyday life in 2045. Then see if your shared vision survives changing budgets,
          unexpected challenges, and changes in government.
        </p>
        <img src={meltonLogo} alt="Melton Foundation" className="home__logo home__logo--right" />
      </header>

      <section className="fan" aria-labelledby="game-title">
        <div className="fan__card fan__card--left" aria-hidden="true" />
        <div className="fan__card fan__card--right" aria-hidden="true" />
        <div className="fan__card fan__card--main">
          <div className="fan__burst">
            <h1 id="game-title" className="fan__title">
              Hold the
              <br />
              vision
            </h1>
            <img src={sdgsLogo} alt="Sustainable Development Goals" className="fan__sdg" />
          </div>
        </div>
      </section>

      <section className="home__band">
        <div className="home__panels">
          <section className="panel panel--host">
            <h2 className="panel__title">Run a session</h2>
            <p className="muted">For the facilitator. Create a room, then share this screen or its QR code.</p>
            <label className="field-label" htmlFor="vision-name">
              Name of the vision
            </label>
            <input id="vision-name" value={visionName} maxLength={80} onChange={(e) => setVisionName(e.target.value)} />

            <fieldset className="packs">
              <legend className="field-label">How the government changes</legend>
              {!content && !contentError && <Loading>Loading country packs</Loading>}
              {content?.packs.map((p) => (
                <label key={p.id} className={`pack ${packId === p.id ? 'is-on' : ''}`}>
                  <input type="radio" name="pack" value={p.id} checked={packId === p.id} onChange={() => setPackId(p.id)} />
                  <span className="pack__name">{p.name}</span>
                  <span className="pack__desc">{p.description}</span>
                </label>
              ))}
            </fieldset>
            <ErrorNote>{contentError || host.error}</ErrorNote>
            <div className="row">
              <button type="button" className="btn btn--primary" onClick={() => create(false)} disabled={host.busy}>
                Create room
              </button>
              <button type="button" className="btn" onClick={() => create(true)} disabled={host.busy}>
                Watch a demo game
              </button>
            </div>
            <p className="muted small">The demo fills empty seats with computer players so you can try the game on your own.</p>
          </section>

          <section className="panel panel--join">
            <h2 className="panel__title">Join a game</h2>
            <p className="muted">For players. Enter the room code shown on the shared screen.</p>
            <form onSubmit={joinGame}>
              <label className="field-label" htmlFor="code">
                Room code
              </label>
              <input
                id="code"
                className="code-input"
                value={code}
                maxLength={5}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="K7QPA"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <label className="field-label" htmlFor="name">
                Your name
              </label>
              <input id="name" value={name} maxLength={40} placeholder="Amina" onChange={(e) => setName(e.target.value)} />
              <ErrorNote>{join.error}</ErrorNote>
              <button type="submit" className="btn btn--primary btn--wide" disabled={join.busy}>
                Join game
              </button>
            </form>
          </section>
        </div>

        <footer className="home__foot">
          <p>© 2026 Melton Foundation Global Citizenship Learning Program. All rights reserved.</p>
          <p>Designed by Adeloh</p>
        </footer>
      </section>
    </div>
  );
}
