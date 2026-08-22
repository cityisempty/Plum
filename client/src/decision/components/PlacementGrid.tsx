import React, { useState } from 'react';
import { CardData, GridSlot, PlacedCard } from '../types';
import { ALL_CARDS, MAX_SELECTIONS } from '../constants';
import { RefreshCw, Check, X, Sparkles } from 'lucide-react';
import { ThemeDefinition } from '../themes/types';

interface PlacementGridProps {
  currentCard?: CardData | null;
  existingPlacements: PlacedCard[];
  onConfirmPlacement: (placement: PlacedCard) => void;
  onCancel?: () => void;
  isReviewMode?: boolean;
  onSubmitReading?: () => void;
  theme: ThemeDefinition;
}

export const PlacementGrid: React.FC<PlacementGridProps> = ({
  currentCard,
  existingPlacements,
  onConfirmPlacement,
  onCancel,
  isReviewMode = false,
  onSubmitReading,
  theme
}) => {
  const [tempPlacement, setTempPlacement] = useState<{ index: number; isFaceUp: boolean; cardId: string } | null>(null);

  const slots: GridSlot[] = Array.from({ length: 9 }, (_, i) => {
    const occupied = existingPlacements.find((p) => p.gridIndex === i);
    const isBeingMoved = occupied && tempPlacement && tempPlacement.cardId === occupied.cardId;
    return {
      index: i,
      occupiedBy: isBeingMoved ? undefined : occupied
    };
  });

  const handleSlotClick = (index: number) => {
    if (tempPlacement) {
      if (slots[index].occupiedBy) return;
      setTempPlacement({ ...tempPlacement, index });
      return;
    }

    if (!isReviewMode && currentCard) {
      if (slots[index].occupiedBy) return;
      setTempPlacement({ index, isFaceUp: true, cardId: currentCard.id });
      return;
    }

    if (isReviewMode && slots[index].occupiedBy) {
      const p = slots[index].occupiedBy!;
      setTempPlacement({ index: p.gridIndex, isFaceUp: p.isFaceUp, cardId: p.cardId });
    }
  };

  const handleFlip = () => {
    if (tempPlacement) {
      setTempPlacement({ ...tempPlacement, isFaceUp: !tempPlacement.isFaceUp });
    }
  };

  const handleConfirm = () => {
    if (tempPlacement) {
      onConfirmPlacement({
        cardId: tempPlacement.cardId,
        gridIndex: tempPlacement.index,
        isFaceUp: tempPlacement.isFaceUp,
      });
      setTempPlacement(null);
    }
  };

  const handleCancelMove = () => {
    if (isReviewMode) {
      setTempPlacement(null);
    } else {
      if (onCancel) onCancel();
    }
  };

  const tempCardInfo = tempPlacement ? ALL_CARDS.find(c => c.id === tempPlacement.cardId) : null;

  // Use Theme Components
  const MiniCard = theme.MiniCard;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col backdrop-blur-md ${theme.id === 'modern' ? 'bg-black/80' : 'bg-slate-50/95'}`}>
      {/* Header - 固定在顶部 */}
      <div className="flex-none pt-6 pb-3 px-4 text-center">
        <h2 className={`text-xl sm:text-2xl font-light tracking-wide ${theme.id === 'modern' ? 'text-white' : 'text-slate-800'}`}>
          {isReviewMode ? '卡牌摆放' : '放置卡牌'}
        </h2>
        <p className={`text-xs sm:text-sm font-medium mt-1 ${theme.id === 'modern' ? 'text-slate-400' : 'text-slate-500'}`}>
          {tempPlacement
            ? '点击格子移动,使用控制按钮调整'
            : isReviewMode
              ? '查看您的布局'
              : '选中一个位置放置您的选择'}
        </p>
      </div>

      {/* 3x3 Grid Container - 居中 */}
      <div className="flex-1 flex items-center justify-center px-4 py-2 overflow-hidden">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className={`w-full rounded-2xl sm:rounded-3xl shadow-xl p-2 sm:p-4 relative ${theme.id === 'modern' ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="grid grid-cols-3 grid-rows-3 gap-1.5 sm:gap-3 w-full">
              {slots.map((slot) => {
                const lockedCardData = slot.occupiedBy;
                const lockedCardInfo = lockedCardData ? ALL_CARDS.find(c => c.id === lockedCardData.cardId) : null;
                const isTempHere = tempPlacement?.index === slot.index;

                return (
                  <div
                    key={slot.index}
                    onClick={() => handleSlotClick(slot.index)}
                    className={`
                                  relative rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center aspect-[3/4]
                                  ${!lockedCardData && !isTempHere ? 'border-2 border-dashed cursor-pointer hover:bg-opacity-10 hover:bg-blue-500' : ''}
                                  ${theme.id === 'modern' ? 'border-slate-700' : 'border-slate-200'}
                                  ${lockedCardData ? 'bg-transparent shadow-sm cursor-pointer hover:-translate-y-1' : ''}
                                  ${isTempHere ? 'z-20 scale-105 sm:scale-110 shadow-2xl ring-2 sm:ring-4 ring-blue-500/30 rounded-lg sm:rounded-xl' : ''}
                              `}
                  >
                    {/* LOCKED CARD */}
                    {lockedCardData && lockedCardInfo && !isTempHere && (
                      <MiniCard card={lockedCardInfo} isFaceUp={lockedCardData.isFaceUp} />
                    )}

                    {/* TEMP CARD (Being Moved) */}
                    {isTempHere && tempCardInfo && (
                      <div className="w-full h-full rounded-lg sm:rounded-xl overflow-hidden shadow-2xl animate-pulse-soft">
                        <MiniCard card={tempCardInfo} isFaceUp={tempPlacement.isFaceUp} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Controls - 固定在底部 */}
      <div className="flex-none pb-6 pt-3 px-4 flex items-center justify-center">
        {tempPlacement ? (
          <div className={`flex items-center gap-6 px-8 py-3 rounded-full shadow-lg border ${theme.id === 'modern' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <button onClick={handleCancelMove} className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-400 transition-colors">
              <X size={20} />
              <span className="text-[10px] font-bold uppercase">取消</span>
            </button>

            <div className="w-px h-8 bg-slate-500/20 mx-2" />

            <button onClick={handleFlip} className="flex flex-col items-center gap-1 text-blue-500 hover:text-blue-400 transition-colors">
              <RefreshCw size={24} className={`transition-transform duration-500 ${tempPlacement.isFaceUp ? "" : "rotate-180"}`} />
              <span className="text-[10px] font-bold uppercase">翻转</span>
            </button>

            <div className="w-px h-8 bg-slate-500/20 mx-2" />

            <button onClick={handleConfirm} className="flex flex-col items-center gap-1 text-emerald-500 hover:text-emerald-400 transition-colors">
              <Check size={24} strokeWidth={3} />
              <span className="text-[10px] font-bold uppercase">放置</span>
            </button>
          </div>
        ) : isReviewMode ? (
          <div className="w-full px-8">
            {existingPlacements.length === MAX_SELECTIONS ? (
              <button
                onClick={onSubmitReading}
                className={`w-full py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 font-bold tracking-widest uppercase text-sm ${theme.id === 'modern' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}
              >
                <Sparkles className="w-5 h-5 text-amber-300" /> 分析决策投射
              </button>
            ) : (
              <div className="text-center text-slate-400 text-sm">放置所有卡牌以继续</div>
            )}
          </div>
        ) : (
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-500 uppercase text-xs tracking-widest font-bold border-b border-transparent hover:border-slate-500 pb-1 transition-all">
            取消选择
          </button>
        )}
      </div>

    </div>
  );
};