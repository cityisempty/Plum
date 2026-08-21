export function AnalysisTransition() {
  return (
    <div className="analysis-transition" role="status" aria-live="polite" aria-label="正在分析">
      <div className="analysis-orbit analysis-orbit-outer" />
      <div className="analysis-orbit analysis-orbit-middle" />
      <svg className="analysis-taiji" viewBox="0 0 160 160" aria-hidden>
        <circle className="analysis-taiji-shadow" cx="80" cy="80" r="54" />
        <path className="analysis-taiji-yang" d="M80 26a54 54 0 0 1 0 108 27 27 0 0 1 0-54 27 27 0 0 0 0-54Z" />
        <circle className="analysis-taiji-dot-dark" cx="80" cy="53" r="8" />
        <circle className="analysis-taiji-dot-light" cx="80" cy="107" r="8" />
        <circle className="analysis-taiji-ring" cx="80" cy="80" r="54" />
      </svg>
      <div className="analysis-trigrams" aria-hidden>
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} style={{ transform: `rotate(${index * 45}deg) translateY(-78px)` }} />
        ))}
      </div>
      <p className="analysis-title">正在观象</p>
      <p className="analysis-caption">让数字与当下相遇</p>
    </div>
  );
}
