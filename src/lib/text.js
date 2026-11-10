export const CYCLE_PHASES = [
  { id: 'disruption', label: 'New challenge' },
  { id: 'budget', label: 'Share the budget' },
  { id: 'anchor', label: 'Protect the vision' },
  { id: 'coordinate', label: 'Work together' },
  { id: 'win', label: 'Show a win' },
  { id: 'succession', label: 'Change of power' },
];

export const PHASE_LABEL = {
  lobby: 'Waiting to start',
  vision: 'Imagine 2045',
  ended: 'Game over',
  ...Object.fromEntries(CYCLE_PHASES.map((p) => [p.id, p.label])),
};

export const PHASE_HELP = {
  lobby: 'Scan the code to join. Choose a role on your phone. The facilitator starts when everyone is ready.',
  vision:
    'Write one sentence about what everyday life could be like in 2045. Then vote: does each card describe a person’s life, or a project? The six most supported life cards become the shared vision.',
  disruption: 'Read the new challenge. It may affect the budget, the vision, or how people work together.',
  budget: 'The Finance player shares money with government ministries. Existing budget promises are paid first.',
  anchor:
    'Government ministries can set a progress target or spend resources on funding, a law, or an institution to protect the vision. Other groups can build public or cross-party support. Without protection, a vision card can weaken.',
  coordinate:
    'Each ministry privately chooses to work together or hold back. If enough work together, the two weakest vision cards grow stronger. Holding back earns a resource, unless the coordinating body can take it away.',
  win:
    'The Head of Government chooses what to show voters. Progress on the vision earns 1 trust. A ribbon earns 2 trust but adds drift. At 3 drift, the vision becomes a list of short-term goals.',
  succession:
    'Vision cards can weaken when the government changes. Cross-party support, public support, or an institution can help protect them. Laws may be repealed.',
  ended: 'The game is over. Open the debrief to see what helped the vision last and what put it at risk.',
};

export const year = (cycle) => 2025 + Math.max(1, cycle) * 5;

/** Same rule as the server: whole-word matches of the project words. */
export function findProjectWords(text, words = []) {
  const lower = ` ${String(text).toLowerCase()} `;
  return words.filter((w) => {
    const escaped = w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'u').test(lower);
  });
}

/** Splits text into segments, marking the ones that sound like a project. */
export function highlightSegments(text, words = []) {
  const hits = findProjectWords(text, words);
  if (!hits.length) return [{ t: text, hit: false }];
  const escaped = hits
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(?<![A-Za-z])(${escaped.join('|')})(?![A-Za-z])`, 'giu');
  const out = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push({ t: text.slice(last, m.index), hit: false });
    out.push({ t: m[0], hit: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last), hit: false });
  return out;
}

export function short(text, len = 60) {
  return text.length > len ? `${text.slice(0, len - 1).trimEnd()}…` : text;
}
