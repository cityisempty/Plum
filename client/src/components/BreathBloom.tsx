import { useEffect, useMemo, useRef, useState } from "react";

const PETAL_COUNT = 12;
const INHALE_SECONDS = 4;
const EXHALE_SECONDS = 6;

function easeInOutSine(value: number) {
  return -(Math.cos(Math.PI * value) - 1) / 2;
}

function lotusPetal(length: number, width: number) {
  return `M${-width},0 C${-width},${-length * 0.35} ${-width * 0.6},${-length * 0.82} 0,${-length} C${
    width * 0.6
  },${-length * 0.82} ${width},${-length * 0.35} ${width},0 Q0,${length * 0.12} ${-width},0 Z`;
}

function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function BreathBloom() {
  const [bloom, setBloom] = useState(0);
  const [rotation, setRotation] = useState(0);
  const startRef = useRef<number | undefined>(undefined);
  const frameRef = useRef<number | undefined>(undefined);
  const reducedMotionRef = useRef(prefersReducedMotion());

  useEffect(() => {
    const cycle = INHALE_SECONDS + EXHALE_SECONDS;
    const tick = (now: number) => {
      if (startRef.current === undefined) startRef.current = now;
      const elapsed = (now - startRef.current) / 1000;
      const position = elapsed % cycle;
      const nextBloom =
        position < INHALE_SECONDS
          ? easeInOutSine(position / INHALE_SECONDS)
          : 1 - easeInOutSine((position - INHALE_SECONDS) / EXHALE_SECONDS);

      setBloom(nextBloom);
      if (!reducedMotionRef.current) setRotation((elapsed * 4) % 360);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const petals = useMemo(() => Array.from({ length: PETAL_COUNT }), []);
  const dotRing = useMemo(
    () =>
      Array.from({ length: 48 }, (_, index) => {
        const angle = (index / 48) * Math.PI * 2;
        return { x: 78 * Math.cos(angle), y: 78 * Math.sin(angle) };
      }),
    [],
  );
  const stars = useMemo(() => {
    const random = mulberry32(42);
    return Array.from({ length: 46 }, () => {
      const radius = Math.sqrt(random()) * 64;
      const angle = random() * Math.PI * 2;
      return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        size: 0.5 + (1 - radius / 64) * 1.1,
        opacity: (0.25 + (1 - radius / 64) * 0.7) * (0.6 + random() * 0.4),
      };
    });
  }, []);
  const spiralArms = useMemo(() => {
    const paths: string[] = [];
    for (let arm = 0; arm < 6; arm += 1) {
      const baseAngle = (arm / 6) * Math.PI * 2;
      let path = "";
      for (let step = 0; step <= 26; step += 1) {
        const progress = step / 26;
        const radius = 66 * (1 - progress * 0.94);
        const angle = baseAngle + progress * ((230 * Math.PI) / 180);
        const x = (radius * Math.cos(angle)).toFixed(2);
        const y = (radius * Math.sin(angle)).toFixed(2);
        path += step === 0 ? `M${x},${y} ` : `L${x},${y} `;
      }
      paths.push(path);
    }
    return paths;
  }, []);

  const petalLength = 55 + 47 * bloom;
  const backPetalLength = 42 + 40 * bloom;
  const coreRadius = 9 + 11 * bloom;

  return (
    <div className="breath" aria-hidden>
      <svg viewBox="0 0 400 400" className="breath-svg">
        <defs>
          <radialGradient id="breath-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f8f0df" />
            <stop offset="100%" stopColor="#e8dcc4" />
          </radialGradient>
          <radialGradient id="breath-petal" cx="50%" cy="92%" r="95%">
            <stop offset="0%" stopColor="#0b2536" />
            <stop offset="55%" stopColor="#154a63" />
            <stop offset="100%" stopColor="#2f8299" />
          </radialGradient>
          <radialGradient id="breath-petal-back" cx="50%" cy="92%" r="95%">
            <stop offset="0%" stopColor="#081b28" />
            <stop offset="100%" stopColor="#1c5a71" />
          </radialGradient>
          <radialGradient id="breath-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff2cf" />
            <stop offset="35%" stopColor="#ffcf78" />
            <stop offset="70%" stopColor="#f0a94e" stopOpacity=".5" />
            <stop offset="100%" stopColor="#f0a94e" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="200" cy="200" r="196" fill="url(#breath-bg)" opacity=".82" />
        <g transform="translate(200 200)">
          {petals.map((_, index) => {
            const angle = (360 / PETAL_COUNT) * (index + 0.5);
            return (
              <g key={`back-${index}`} transform={`rotate(${angle})`} opacity=".85">
                <g transform="translate(0 -84)">
                  <path
                    d={lotusPetal(backPetalLength, 24.6)}
                    fill="url(#breath-petal-back)"
                    stroke="#9c7a35"
                    strokeWidth=".6"
                    strokeOpacity=".5"
                  />
                </g>
              </g>
            );
          })}

          {petals.map((_, index) => {
            const angle = (360 / PETAL_COUNT) * index;
            return (
              <g key={`front-${index}`} transform={`rotate(${angle})`}>
                <g transform="translate(0 -90)">
                  <path d={lotusPetal(petalLength, 30)} fill="url(#breath-petal)" stroke="#d9b66b" strokeWidth="1.1" />
                  <path d={lotusPetal(petalLength * 0.74, 22.2)} fill="none" stroke="#e8c988" strokeWidth=".6" strokeOpacity=".55" />
                  <path d={lotusPetal(petalLength * 0.46, 13.8)} fill="none" stroke="#e8c988" strokeWidth=".5" strokeOpacity=".4" />
                  <line x1="0" y1="0" x2="0" y2={-petalLength * 0.92} stroke="#e8c988" strokeWidth=".5" strokeOpacity=".35" />
                </g>
              </g>
            );
          })}

          <circle r="94" fill="none" stroke="#d9b66b" strokeWidth="1.4" strokeOpacity=".75" />
          <circle r="90" fill="none" stroke="#d9b66b" strokeWidth=".7" strokeOpacity=".5" />
          {dotRing.map((point, index) => (
            <circle key={index} cx={point.x} cy={point.y} r="1.7" fill="#e6c179" opacity=".9" />
          ))}
          <circle r="72" fill="none" stroke="#d9b66b" strokeWidth="1.2" strokeOpacity=".7" />
          <circle r="68" fill="none" stroke="#d9b66b" strokeWidth=".6" strokeOpacity=".45" />

          <g transform={`rotate(${rotation})`}>
            <circle r="68" fill="#08182a" />
            {spiralArms.map((path, index) => (
              <path key={index} d={path} fill="none" stroke="#d9b66b" strokeWidth=".9" strokeOpacity=".5" strokeLinecap="round" />
            ))}
            {stars.map((star, index) => (
              <circle key={index} cx={star.x} cy={star.y} r={star.size} fill="#f4e2ad" opacity={star.opacity} />
            ))}
          </g>

          <circle r={coreRadius * 1.8} fill="url(#breath-core)" />
          <circle r={coreRadius * 0.32} fill="#fff6e0" opacity=".9" />
        </g>
      </svg>
    </div>
  );
}
