import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { getToken, setToken } from '../lib/storage.js';
import { useAction } from '../lib/useGame.js';
import { ErrorNote } from '../components/Pieces.jsx';

/** Where the QR code on the shared screen leads. */
export default function Join() {
  const { code: raw } = useParams();
  const code = raw.toUpperCase();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const { run, busy, error, setError } = useAction();

  useEffect(() => {
    if (getToken('player', code)) navigate(`/play/${code}`, { replace: true });
  }, [code, navigate]);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter your name so others know who you are.');
      return;
    }
    await run(async () => {
      const p = await api(`/sessions/${code}/join`, { method: 'POST', body: { name } });
      setToken('player', code, p.playerToken);
      navigate(`/play/${code}`);
    });
  }

  return (
    <div className="phone phone--center">
      <div className="minicard" aria-hidden="true">
        <div className="minicard__burst">Hold the vision</div>
      </div>
      <h1 className="sr-only">Hold the Vision</h1>
      <p className="join__room">
        Join room <strong className="codechip">{code}</strong>
      </p>
      <form onSubmit={submit} className="stack join__form">
        <label className="field-label" htmlFor="name">
          Your name
        </label>
        <input id="name" value={name} maxLength={40} autoFocus placeholder="Amina" onChange={(e) => setName(e.target.value)} />
        <ErrorNote>{error}</ErrorNote>
        <button type="submit" className="btn btn--primary btn--wide" disabled={busy}>
          Join game
        </button>
      </form>
      <p className="small muted join__back">
        <Link to="/">Back to the start</Link>
      </p>
    </div>
  );
}
