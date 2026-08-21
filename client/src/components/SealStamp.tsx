type Props = {
  text: string;
  caption?: string;
};

export function SealStamp({ text, caption }: Props) {
  return (
    <div className="seal">
      <strong>{text}</strong>
      {caption ? <em>{caption}</em> : null}
      <style>{`
        .seal {
          width: 72px;
          height: 72px;
          border: 2px solid var(--cinnabar);
          color: var(--cinnabar);
          display: grid;
          place-items: center;
          text-align: center;
          transform: rotate(-8deg);
          background: rgba(179, 51, 42, 0.04);
          animation: stamp 0.45s cubic-bezier(.2,1.4,.3,1) both;
        }
        .seal strong {
          font-family: var(--font-seal);
          font-size: 22px;
          font-weight: 400;
          letter-spacing: 0.08em;
        }
        .seal em {
          font-style: normal;
          font-size: 10px;
          letter-spacing: 0.2em;
        }
        @keyframes stamp {
          0% { opacity: 0; transform: rotate(-18deg) scale(1.4); }
          70% { opacity: 1; transform: rotate(-6deg) scale(0.96); }
          100% { opacity: 1; transform: rotate(-8deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
