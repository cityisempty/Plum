import React, { useState } from 'react';
import { ThemeDefinition, ThemeCardProps, ThemeMiniCardProps } from './types';
import { Image as ImageIcon } from 'lucide-react';

// --- Components ---

const ClassicCardFace: React.FC<ThemeCardProps> = ({ card, isSelected, isDisabled, isPressing, progress = 0 }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`
      relative w-full h-full rounded-xl bg-white shadow-sm border border-slate-100
      flex flex-col items-center justify-center overflow-hidden
      transition-all duration-300
      ${isSelected ? 'ring-4 ring-amber-400 ring-offset-2 z-10 scale-105 shadow-xl' : ''}
      ${isDisabled && !isSelected ? 'opacity-40 grayscale' : 'hover:shadow-md hover:-translate-y-1'}
      ${isPressing ? 'scale-95' : ''}
    `}>
      {/* Try to load image, fallback to generic icon */}
      {!imageError ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onError={() => setImageError(true)}
          style={{
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            userSelect: 'none',
            WebkitUserDrag: 'none',
            WebkitTouchCallout: 'none',
            touchAction: 'manipulation',
            pointerEvents: 'none',
          } as React.CSSProperties}
        />
      ) : (
        <div className="flex flex-col items-center justify-center opacity-20 gap-2">
          <ImageIcon size={32} />
        </div>
      )}

      {/* Progress Ring for Classic Theme */}
      {isPressing && (
        <div className="absolute inset-0 rounded-xl bg-slate-50/50 backdrop-blur-[1px] flex items-center justify-center">
          <svg className="w-12 h-12 -rotate-90">
            <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4" fill="none" />
            <circle
              cx="24" cy="24" r="20"
              stroke="#0ea5e9" strokeWidth="4" fill="none"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 * (1 - progress / 100)}
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

const ClassicBackDesign: React.FC = () => (
  <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 rounded-lg flex items-center justify-center relative overflow-hidden border-2 border-amber-600/40">
    {/* 背景光晕 */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />

    {/* 外层装饰圆环 */}
    <div className="absolute inset-3 border-2 border-amber-500/30 rounded-full" />
    <div className="absolute inset-5 border border-amber-400/20 rounded-full" />

    {/* 曼陀罗花纹 - 8个方向的线条 */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <div
        key={angle}
        className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'center',
        }}
      />
    ))}

    {/* 中心符文 */}
    <div className="relative z-10 w-10 h-10 rounded-full border-2 border-amber-400/60 flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-purple-500/20 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
      <div className="w-4 h-4 bg-amber-400/80 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
      {/* 内部装饰 */}
      <div className="absolute inset-2 border border-amber-300/40 rounded-full" />
    </div>

    {/* 四角装饰 */}
    {['top-1 left-1', 'top-1 right-1', 'bottom-1 left-1', 'bottom-1 right-1'].map((position, i) => (
      <div key={i} className={`absolute ${position} w-2 h-2 border-t-2 border-l-2 border-amber-500/40 ${i % 2 === 0 ? '' : 'rotate-90'}`} />
    ))}
  </div>
);

const ClassicMiniCard: React.FC<ThemeMiniCardProps> = ({ card, isFaceUp }) => {
  const [imageError, setImageError] = useState(false);

  if (!isFaceUp) return <ClassicBackDesign />;

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col items-center justify-center overflow-hidden">
      {!imageError ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onError={() => setImageError(true)}
          style={{
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            userSelect: 'none',
            WebkitUserDrag: 'none',
            WebkitTouchCallout: 'none',
            touchAction: 'manipulation',
            pointerEvents: 'none',
          } as React.CSSProperties}
        />
      ) : (
        <div className="opacity-20">
          <ImageIcon size={20} />
        </div>
      )}
    </div>
  );
};

// --- Definition ---

export const ClassicTheme: ThemeDefinition = {
  id: 'classic',
  name: 'Zen',
  description: 'Clean, bright, and minimal.',
  appBackgroundClass: 'bg-slate-50',
  CardFace: ClassicCardFace,
  MiniCard: ClassicMiniCard,
  BackDesign: ClassicBackDesign,
};