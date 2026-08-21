import React, { useState, useRef, useEffect } from 'react';
import { CardData } from '../types';
import { ThemeDefinition } from '../themes/types';

interface CardViewProps {
  card: CardData;
  isSelected: boolean;
  isDisabled: boolean;
  onLongPress: (cardId: string) => void;
  onClick?: (cardId: string) => void;
  theme: ThemeDefinition;
}

export const CardView: React.FC<CardViewProps> = ({ card, isSelected, isDisabled, onLongPress, onClick, theme }) => {
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null); // 新增: 100ms 观察期,防抖动
  const animationFrame = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 触摸位置追踪
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef<boolean>(false);
  const isLongPressTriggered = useRef<boolean>(false);

  const LONG_PRESS_DURATION = 350; // 区分点击和长按
  const PRESS_DELAY = 100; // 观察期
  const MOVE_THRESHOLD = 10;

  const startPressSequence = () => {
    setIsPressing(true);
    startTime.current = Date.now();
    isLongPressTriggered.current = false;

    // 启动进度动画
    const animate = () => {
      const elapsed = Date.now() - startTime.current;
      const p = Math.min(100, (elapsed / LONG_PRESS_DURATION) * 100);
      setProgress(p);

      if (p < 100) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };
    animationFrame.current = requestAnimationFrame(animate);

    // 启动长按计时器
    pressTimer.current = setTimeout(() => {
      if (!hasMoved.current) {
        // 暂时屏蔽长按选择功能
        /* 
        isLongPressTriggered.current = true;
        onLongPress(card.id);
        handleEnd(true); 
        */
      }
    }, LONG_PRESS_DURATION);
  };

  const handleStart = (clientX: number, clientY: number) => {
    if (isDisabled) return;

    // 记录初始触摸位置
    touchStartPos.current = { x: clientX, y: clientY };
    hasMoved.current = false;
    isLongPressTriggered.current = false;

    // 启动 100ms 观察期 (仅用于开启进度条动画，点击不再等待此周期)
    delayTimer.current = setTimeout(() => {
      if (!hasMoved.current) {
        startPressSequence();
      }
    }, PRESS_DELAY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!touchStartPos.current || hasMoved.current) return;

    const deltaX = clientX - touchStartPos.current.x;
    const deltaY = clientY - touchStartPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 稍微调大阈值到 15px 增加稳定性
    const THRESHOLD = 15;
    if (distance > THRESHOLD) {
      hasMoved.current = true;
      handleEnd();
    }
  };

  const handleEnd = (fromLongPress = false) => {
    // 关键修复：只要没有显著位移且不是被长按触发的，即判定为点击
    if (!fromLongPress && !isLongPressTriggered.current && !hasMoved.current && touchStartPos.current) {
      onClick?.(card.id);
    }

    touchStartPos.current = null;
    setIsPressing(false);
    setProgress(0);

    if (delayTimer.current) clearTimeout(delayTimer.current);
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
  };

  // 使用useEffect添加触摸事件监听器(智能长按检测)
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // 用于智能preventDefault的状态
    let preventDefaultTimer: ReturnType<typeof setTimeout> | null = null;
    let touchStartEvent: TouchEvent | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (isDisabled) return;

      // 保存事件引用
      touchStartEvent = e;

      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);

      // 启动100ms定时器,如果期间没有移动,则阻止默认行为
      preventDefaultTimer = setTimeout(() => {
        if (!hasMoved.current && touchStartEvent) {
          // Detect if we should prevent default to avoid system menus
        }
      }, 100);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);

      // 如果用户开始移动,取消阻止默认行为
      if (hasMoved.current && preventDefaultTimer) {
        clearTimeout(preventDefaultTimer);
        preventDefaultTimer = null;
      }
    };

    const handleTouchEndLocal = (e: TouchEvent) => {
      // 清理定时器
      if (preventDefaultTimer) {
        clearTimeout(preventDefaultTimer);
        preventDefaultTimer = null;
      }
      touchStartEvent = null;

      // 关键修复：如果本次触摸被判定为点击（未移动），则阻止浏览器合成 mouse/click 事件。
      // 否则合成的 click 会在约 300ms 后打到预览弹窗遮罩层上，导致弹窗刚打开就被关闭。
      if (!hasMoved.current) {
        e.preventDefault();
      }

      handleEnd();
    };

    // 添加事件监听器
    // 使用 passive: true 以允许原生滚动
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEndLocal, { passive: false });
    element.addEventListener('touchcancel', handleTouchEndLocal, { passive: true });

    return () => {
      if (preventDefaultTimer) {
        clearTimeout(preventDefaultTimer);
      }
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEndLocal);
      element.removeEventListener('touchcancel', handleTouchEndLocal);
    };
  }, [isDisabled, card.id]);

  // Delegate rendering to the Theme Component
  const ThemeCardFace = theme.CardFace;

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={() => handleEnd()}
      onMouseLeave={() => handleEnd()}
      onContextMenu={(e) => e.preventDefault()} // 禁用右键菜单
      className={`relative aspect-[3/4] select-none`}
      style={{
        WebkitUserSelect: 'none',
        msUserSelect: 'none',               // IE/Edge
        WebkitTouchCallout: 'none',         // iOS Safari 禁用长按菜单
        userSelect: 'none',
        WebkitUserDrag: 'none',
        touchAction: 'pan-y',              // 关键：允许垂直滚动，这也是解决您滑动问题的核心
        WebkitTapHighlightColor: 'transparent', // 移除点击高亮
      } as React.CSSProperties}
    >
      <ThemeCardFace
        card={card}
        isSelected={isSelected}
        isDisabled={isDisabled}
        isPressing={isPressing}
        progress={progress}
      />
    </div>
  );
};