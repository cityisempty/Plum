type Props = {
  lines: boolean[];
  names?: string[];
  moving?: number;
};

export function YaoLines({ lines, names, moving }: Props) {
  const ordered = [...lines].map((yang, i) => ({ yang, pos: i + 1, name: names?.[i] })).reverse();
  return (
    <div className="yao-col" aria-hidden={false}>
      {ordered.map((y) => {
        const active = moving === y.pos;
        return (
          <div key={y.pos} className={"yao-row" + (active ? " is-moving" : "")}>
            <span className="yao-name">{y.name ?? ""}</span>
            <svg viewBox="0 0 160 18" width="160" height="18">
              {y.yang ? (
                <rect x="4" y="6" width="152" height="6" rx="0.5" />
              ) : (
                <>
                  <rect x="4" y="6" width="64" height="6" rx="0.5" />
                  <rect x="92" y="6" width="64" height="6" rx="0.5" />
                </>
              )}
            </svg>
          </div>
        );
      })}
      <style>{`
        .yao-col { display: grid; gap: 8px; transform: scale(0.86); }
        .yao-row { display: flex; align-items: center; gap: 10px; }
        .yao-name { width: 2.2em; font-size: 11px; letter-spacing: 0.08em; color: var(--ink-soft); }
        .yao-row svg { fill: var(--ink); }
        .yao-row.is-moving svg { fill: var(--cinnabar); }
        .yao-row.is-moving .yao-name { color: var(--cinnabar); }
        .yao-row { animation: yao-in 0.55s ease both; }
        .yao-row:nth-child(1) { animation-delay: 0.05s; }
        .yao-row:nth-child(2) { animation-delay: 0.12s; }
        .yao-row:nth-child(3) { animation-delay: 0.19s; }
        .yao-row:nth-child(4) { animation-delay: 0.26s; }
        .yao-row:nth-child(5) { animation-delay: 0.33s; }
        .yao-row:nth-child(6) { animation-delay: 0.4s; }
        @keyframes yao-in {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
