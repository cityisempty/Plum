const STROKE = "var(--cinnabar)";

type Props = {
  nature: string;
};

/** 以上卦物象为禅意主图：天泽火雷风水山地 */
export function NatureSigil({ nature }: Props) {
  const n = nature || "天";
  return (
    <svg className="sigil-svg" viewBox="0 0 240 240" aria-hidden>
      <title>{n}</title>
      {draw(n)}
    </svg>
  );
}

function draw(n: string) {
  switch (n) {
    case "天":
      return (
        <>
          <circle cx="120" cy="118" r="62" fill="none" stroke={STROKE} strokeWidth="1.2" />
          <path d="M78 92c18-22 48-22 66 0" fill="none" stroke={STROKE} strokeWidth="1.1" strokeLinecap="round" />
        </>
      );
    case "泽":
      return (
        <>
          <ellipse cx="120" cy="128" rx="70" ry="18" fill="none" stroke={STROKE} strokeWidth="1.2" />
          <ellipse cx="120" cy="128" rx="42" ry="10" fill="none" stroke={STROKE} strokeWidth="1.1" />
          <path d="M120 86c0 18-8 28-8 42" fill="none" stroke={STROKE} strokeWidth="1.1" strokeLinecap="round" />
        </>
      );
    case "火":
      return (
        <path
          d="M120 188c-32-18-46-48-38-82 8 14 22 18 28 8 2-28 18-52 32-64 2 36 28 58 22 92-6 28-24 42-44 46z"
          fill="none"
          stroke={STROKE}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      );
    case "雷":
      return (
        <path
          d="M132 48 L92 118 H128 L96 196"
          fill="none"
          stroke={STROKE}
          strokeWidth="1.6"
          strokeLinejoin="miter"
          strokeLinecap="round"
        />
      );
    case "风":
      return (
        <>
          <path d="M48 92 C96 70 132 78 196 64" fill="none" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M40 124 C92 108 140 118 204 104" fill="none" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M56 156 C104 140 148 148 192 140" fill="none" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
        </>
      );
    case "水":
      return (
        <>
          <path d="M48 120 C80 92 112 148 148 118 S196 92 210 112" fill="none" stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M60 148 C96 128 124 168 168 146" fill="none" stroke={STROKE} strokeWidth="1.1" strokeLinecap="round" />
        </>
      );
    case "山":
      return (
        <>
          <path d="M28 168 L88 88 L132 148" fill="none" stroke={STROKE} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M108 168 L168 72 L220 168" fill="none" stroke={STROKE} strokeWidth="1.3" strokeLinejoin="round" />
        </>
      );
    default:
      return (
        <>
          <line x1="36" y1="150" x2="204" y2="150" stroke={STROKE} strokeWidth="1.2" />
          <line x1="52" y1="128" x2="188" y2="128" stroke={STROKE} strokeWidth="0.9" opacity="0.7" />
        </>
      );
  }
}
