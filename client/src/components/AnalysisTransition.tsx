type Props = {
  digits?: string;
};

function AbstractMark({ variant }: { variant: "first" | "second" }) {
  return (
    <svg className="analysis-abstract" viewBox="0 0 180 180" aria-hidden>
      {variant === "first" ? (
        <>
          <circle cx="90" cy="90" r="55" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M42 104c16-42 52-55 88-35 19 11 20 33 3 44-19 12-46 3-48-18-2-19 17-34 34-26"
            fill="none"
            stroke="var(--cinnabar)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="90" cy="90" r="4" fill="var(--cinnabar)" />
        </>
      ) : (
        <>
          <path
            d="M90 30c25 19 43 41 43 64 0 30-20 53-43 53s-43-23-43-53c0-23 18-45 43-64Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M90 43c-4 32 8 44 26 56-15 4-27 0-35-11-8-10-9-25 9-45ZM90 43c4 32-8 44-26 56 15 4 27 0 35-11 8-10 9-25-9-45Z"
            fill="var(--cinnabar-soft)"
            stroke="var(--cinnabar)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M90 43v104" stroke="currentColor" strokeWidth="1" opacity=".55" />
        </>
      )}
    </svg>
  );
}

export function AnalysisTransition({ digits = "38" }: Props) {
  const first = digits.slice(0, 1) || "3";
  const second = digits.slice(1, 2) || "8";

  return (
    <div className="analysis-transition" role="status" aria-live="polite" aria-label="正在分析">
      <div className="analysis-sequence" aria-hidden>
        <span className="analysis-sequence-item analysis-sequence-number analysis-sequence-first">{first}</span>
        <span className="analysis-sequence-item analysis-sequence-mark analysis-sequence-mark-first">
          <AbstractMark variant="first" />
        </span>
        <span className="analysis-sequence-item analysis-sequence-number analysis-sequence-second">{second}</span>
        <span className="analysis-sequence-item analysis-sequence-mark analysis-sequence-mark-second">
          <AbstractMark variant="second" />
        </span>
      </div>
      <p className="analysis-title">正在观象</p>
      <p className="analysis-caption">让数字与当下相遇</p>
    </div>
  );
}
