import React, { useState } from 'react';
import { ThemeDefinition, ThemeCardProps, ThemeMiniCardProps } from './types';
import { Image as ImageIcon } from 'lucide-react';

// --- Helpers ---
const getElementColor = (element: string) => {
  switch (element) {
    case 'Fire': return 'from-red-500/20 to-orange-500/20 border-red-200/20';
    case 'Water': return 'from-blue-500/20 to-cyan-500/20 border-blue-200/20';
    case 'Air': return 'from-sky-300/20 to-indigo-300/20 border-sky-100/20';
    case 'Earth': return 'from-emerald-500/20 to-teal-600/20 border-emerald-200/20';
    case 'Spirit': return 'from-purple-500/20 to-fuchsia-600/20 border-purple-200/20';
    default: return 'from-slate-500/20 to-gray-500/20 border-slate-200/20';
  }
};

// --- Components ---

const ModernCardFace: React.FC<ThemeCardProps> = ({ card, isSelected, isDisabled, isPressing, progress = 0 }) => {
  const gradientClass = getElementColor(card.element);
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`
      relative w-full h-full rounded-xl overflow-hidden
      bg-slate-900/80 backdrop-blur-md border 
      flex flex-col items-center justify-center
      transition-all duration-300
      ${gradientClass}
      ${isSelected ? 'ring-2 ring-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105 z-10' : 'border-white/10'}
      ${isDisabled && !isSelected ? 'opacity-20 grayscale cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'}
      ${isPressing ? 'scale-95 brightness-110' : ''}
    `}>
      {/* Decorative background mesh */}
      <div className="absolute inset-0 bg-gradient-to-br opacity-30" />

      {/* Symbol Container / Image */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {!imageError ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
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
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner opacity-50">
            <ImageIcon size={24} className="text-white" />
          </div>
        )}
      </div>

      {/* Progress Bar (Bottom) */}
      {isPressing && (
        <div className="absolute bottom-0 left-0 h-1 bg-white/50 transition-all duration-75 ease-linear" style={{ width: `${progress}%` }} />
      )}
    </div>
  );
};

const ModernBackDesign: React.FC = () => (
  <div className="w-full h-full bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden border border-indigo-500/30">
    {/* 星空背景 */}
    <div className="absolute inset-0 opacity-40">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>

    {/* 旋转的外圈 */}
    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
      <div className="absolute inset-4 border border-cyan-400/20 rounded-full" />
    </div>

    {/* 几何符文框架 */}
    <div className="absolute inset-4 border border-indigo-400/30 rotate-45" />
    <div className="absolute inset-6 border border-purple-400/20 -rotate-12" />

    {/* 六芒星图案 */}
    <svg className="absolute w-16 h-16 opacity-30" viewBox="0 0 100 100">
      <polygon
        points="50,10 61,40 93,40 67,58 78,88 50,70 22,88 33,58 7,40 39,40"
        fill="none"
        stroke="url(#grad1)"
        strokeWidth="1.5"
      />
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'rgb(99, 102, 241)', stopOpacity: 0.6 }} />
          <stop offset="100%" style={{ stopColor: 'rgb(168, 85, 247)', stopOpacity: 0.6 }} />
        </linearGradient>
      </defs>
    </svg>

    {/* 中心发光核心 */}
    <div className="relative z-10 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8),0_0_30px_rgba(99,102,241,0.4)]">
      <div className="absolute inset-0 bg-white/50 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
    </div>

    {/* 符文边框装饰 */}
    <div className="absolute top-2 left-2 w-1 h-3 bg-gradient-to-b from-indigo-400/60 to-transparent" />
    <div className="absolute top-2 right-2 w-1 h-3 bg-gradient-to-b from-indigo-400/60 to-transparent" />
    <div className="absolute bottom-2 left-2 w-1 h-3 bg-gradient-to-t from-indigo-400/60 to-transparent" />
    <div className="absolute bottom-2 right-2 w-1 h-3 bg-gradient-to-t from-indigo-400/60 to-transparent" />
  </div>
);

const ModernMiniCard: React.FC<ThemeMiniCardProps> = ({ card, isFaceUp }) => {
  const [imageError, setImageError] = useState(false);
  const gradientClass = getElementColor(card.element);

  if (!isFaceUp) return <ModernBackDesign />;

  return (
    <div className={`w-full h-full rounded-lg flex items-center justify-center bg-slate-900 border overflow-hidden ${gradientClass}`}>
      {!imageError ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]"
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
        <ImageIcon size={16} className="text-white/30" />
      )}
    </div>
  );
};

// --- Definition ---

export const ModernTheme: ThemeDefinition = {
  id: 'modern',
  name: 'Astral',
  description: 'Dark, mystical, and ethereal.',
  appBackgroundClass: 'bg-slate-950 text-white',
  CardFace: ModernCardFace,
  MiniCard: ModernMiniCard,
  BackDesign: ModernBackDesign,
};