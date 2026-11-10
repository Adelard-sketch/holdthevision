/** Six-ability profile for the debrief. Scores are 0 to 100. */
export default function Radar({ abilities, weakest = [] }) {
  const size = 340;
  const c = size / 2;
  const r = 104;
  const n = abilities.length;
  const point = (i, v) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v];
  };
  const poly = abilities.map((ab, i) => point(i, ab.score / 100).join(',')).join(' ');
  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={abilities.map((a) => `${a.name} ${a.score}`).join(', ')}>
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon key={s} className="radar__ring" points={abilities.map((_, i) => point(i, s).join(',')).join(' ')} />
      ))}
      {abilities.map((_, i) => {
        const [x, y] = point(i, 1);
        return <line key={i} className="radar__spoke" x1={c} y1={c} x2={x} y2={y} />;
      })}
      <polygon className="radar__shape" points={poly} />
      {abilities.map((ab, i) => {
        const [x, y] = point(i, ab.score / 100);
        return <circle key={ab.id} cx={x} cy={y} r="4.5" className={`radar__dot ${weakest.includes(ab.id) ? 'is-weak' : ''}`} />;
      })}
      {abilities.map((ab, i) => {
        const [x, y] = point(i, 1.2);
        const anchor = Math.abs(x - c) < 10 ? 'middle' : x > c ? 'start' : 'end';
        const words = ab.name.split(' ');
        const half = Math.ceil(words.length / 2);
        const lines = words.length > 2 ? [words.slice(0, half).join(' '), words.slice(half).join(' ')] : [ab.name];
        const top = y < c - 10 ? -(lines.length * 14) : 0;
        return (
          <text key={ab.id} x={x} y={y + top} textAnchor={anchor} className={`radar__label ${weakest.includes(ab.id) ? 'is-weak' : ''}`}>
            {lines.map((line, k) => (
              <tspan key={k} x={x} dy={k === 0 ? 0 : 14}>
                {line}
              </tspan>
            ))}
            <tspan x={x} dy="16" className="radar__score">
              {ab.score}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
