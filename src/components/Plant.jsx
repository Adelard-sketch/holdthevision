import { usePrevious } from '../lib/useGame.js';

const GROUND = 150;
const MAX_STEM = 118;
const MAX_HEALTH = 4;

// Each instrument is a root at its own depth. Deeper roots hold through more.
const ROOTS = {
  kpi: { d: 'M80 152 C 72 160, 58 166, 44 176', w: 1.6 },
  budget_line: { d: 'M80 152 C 74 170, 66 186, 58 204', w: 3 },
  law: { d: 'M80 152 C 88 172, 98 190, 108 212', w: 3.4 },
  institution: { d: 'M80 152 C 81 180, 79 206, 80 234', w: 6 },
};

/**
 * One vision element drawn as a plant. Health is how tall it stands, roots
 * are the instruments that bind it, the flower takes the colour of whoever
 * contributed it, and figures on the ground show public salience.
 */
export default function Plant({ element, roleById, compact = false }) {
  const prev = usePrevious(element.health);
  const health = element.health;
  const alive = element.status === 'alive';
  const changed = prev === undefined || prev === health ? '' : prev > health ? 'is-hit' : 'is-grown';
  const stemH = (MAX_STEM * Math.max(health, 0.35)) / MAX_HEALTH;
  const anchors = new Set(element.anchors.map((a) => a.type));
  const flowerColor = roleById?.[element.contributorRoles?.[0]]?.color ?? '#2E7A57';

  return (
    <svg
      className={`plant ${alive ? '' : 'is-shelved'} ${changed} ${compact ? 'is-compact' : ''}`}
      viewBox="0 0 160 240"
      role="img"
      aria-label={`${element.text}. Health ${health} of 4. ${anchors.size} instrument(s) attached.${
        alive ? '' : ' Shelved.'
      }`}
    >
      <rect className="plant__sky" x="0" y="0" width="160" height={GROUND} />
      <rect className="plant__soil" x="0" y={GROUND} width="160" height={240 - GROUND} />
      <path className="plant__grass" d={`M0 ${GROUND} H160`} />

      {Object.entries(ROOTS).map(([type, r]) => (
        <path
          key={type}
          className={`plant__root ${anchors.has(type) ? 'is-set' : ''} plant__root--${type}`}
          d={r.d}
          strokeWidth={r.w}
        />
      ))}

      {alive ? (
        <g className="plant__body">
          <path
            className="plant__stem"
            d={`M80 ${GROUND} C 77 ${GROUND - stemH * 0.35}, 84 ${GROUND - stemH * 0.7}, 80 ${GROUND - stemH}`}
          />
          {[1, 2, 3, 4].map((k) => {
            const y = GROUND - stemH * (k / (health + 0.8));
            const left = k % 2 === 1;
            return (
              <g
                key={k}
                className="plant__leaf"
                style={{ opacity: health >= k ? 1 : 0, transform: `translate(80px, ${y}px)` }}
              >
                <ellipse
                  cx={left ? -13 : 13}
                  cy="0"
                  rx="14"
                  ry="5.5"
                  transform={`rotate(${left ? 28 : -28} ${left ? -13 : 13} 0)`}
                />
              </g>
            );
          })}
          <g className="plant__flower" style={{ transform: `translate(80px, ${GROUND - stemH}px)` }}>
            {health >= MAX_HEALTH ? (
              [0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx="0" cy="-8" rx="5" ry="8.5" fill={flowerColor} transform={`rotate(${a})`} />
              ))
            ) : (
              <ellipse cx="0" cy="-3" rx="4.5" ry="6" fill={flowerColor} />
            )}
            {health >= MAX_HEALTH && <circle r="3.4" className="plant__heart" />}
          </g>
        </g>
      ) : (
        <path className="plant__wilt" d={`M80 ${GROUND} C 80 128, 90 118, 104 122 C 112 124, 114 132, 112 140`} />
      )}

      {Array.from({ length: element.salience }).map((_, i) => (
        <g key={i} className="plant__person" transform={`translate(${18 + i * 13} ${GROUND - 2})`}>
          <circle cx="0" cy="-15" r="3.4" />
          <path d="M0 -11 V-3 M-4 -8 H4 M0 -3 L-3 2 M0 -3 L3 2" />
        </g>
      ))}

      {element.crossParty && (
        <g className="plant__pact" transform={`translate(136 ${GROUND - 12})`}>
          <circle cx="-5" cy="0" r="6.5" />
          <circle cx="5" cy="0" r="6.5" />
        </g>
      )}
    </svg>
  );
}
