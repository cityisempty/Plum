import React, { useState, useEffect, useRef } from 'react';

interface LoadingAnimationProps {
    theme: 'classic' | 'modern';
}

const LOADING_MESSAGES = [
    '正在构建你的决策树...',
    '正在分析决策模式...',
    '正在探寻模式根源...',
    '正在解读卡牌组合...',
    '正在识别思维倾向...',
    '正在评估决策风格...',
    '正在追溯心理机制...',
    '正在绘制认知地图...',
    '正在洞察行为模式...',
    '正在解析价值排序...',
    '正在梳理决策逻辑...',
    '正在探索潜在动机...',
    '正在构建心理画像...',
    '正在分析情绪影响...',
    '正在定位核心问题...',
    '正在寻找改进路径...',
    '正在整合分析结果...',
    '正在生成个性化建议...',
    '正在优化表达方式...',
    '正在完善解读报告...',
];

const ORBIT_NODES = Array.from({ length: 9 }, (_, index) => index);
const BREATHING_DOTS = Array.from({ length: 5 }, (_, index) => index);

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ theme }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const messageInterval = window.setInterval(() => {
            setIsVisible(false);
            timeoutRef.current = window.setTimeout(() => {
                setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
                setIsVisible(true);
            }, 260);
        }, 2200);

        return () => {
            window.clearInterval(messageInterval);
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        };
    }, []);

    const isDark = theme === 'modern';

    return (
        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-5 py-6 backdrop-blur-md ${isDark ? 'bg-slate-950/88 text-white' : 'bg-white/90 text-slate-900'}`}>
            <div className={`decision-loading-aura decision-loading-aura-one ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-200/50'}`} />
            <div className={`decision-loading-aura decision-loading-aura-two ${isDark ? 'bg-fuchsia-500/16' : 'bg-amber-200/50'}`} />

            <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-5 sm:gap-7">
                <div className="decision-orbit-stage" aria-hidden="true">
                    <div className={`decision-orbit-shell ${isDark ? 'decision-orbit-shell-dark' : 'decision-orbit-shell-light'}`}>
                        <div className="decision-orbit-ring decision-orbit-ring-one" />
                        <div className="decision-orbit-ring decision-orbit-ring-two" />
                        <div className="decision-orbit-ring decision-orbit-ring-three" />
                        <div className="decision-orbit-grid">
                            {ORBIT_NODES.map((node) => (
                                <span key={node} style={{ animationDelay: `${node * 0.13}s` }} />
                            ))}
                        </div>
                        <div className="decision-orbit-sweep" />
                        <div className="decision-orbit-cards decision-orbit-cards-one">
                            <i />
                            <i />
                            <i />
                        </div>
                        <div className="decision-orbit-cards decision-orbit-cards-two">
                            <i />
                            <i />
                            <i />
                        </div>
                        <div className="decision-orbit-core">
                            <span />
                            <b />
                        </div>
                    </div>
                </div>

                <div className="w-full text-center">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.32em] ${isDark ? 'text-indigo-200/80' : 'text-slate-500'}`}>
                        AI DECISION READING
                    </p>
                    <div className="mt-2 min-h-[3.25rem] overflow-visible px-2 sm:min-h-[3.5rem]">
                        <p
                            className={`whitespace-normal break-words text-center text-lg font-medium leading-relaxed transition-all duration-500 sm:text-xl ${isVisible ? 'translate-y-0 opacity-100 blur-0' : '-translate-y-2 opacity-0 blur-[2px]'}`}
                        >
                            {LOADING_MESSAGES[currentMessageIndex]}
                        </p>
                    </div>
                    <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        正在生成完整解读，请保持页面打开
                    </p>
                </div>

                <div className="flex items-center gap-1.5" aria-hidden="true">
                    {BREATHING_DOTS.map((dot) => (
                        <span
                            key={dot}
                            className={`decision-loading-dot ${isDark ? 'bg-indigo-300' : 'bg-slate-700'}`}
                            style={{ animationDelay: `${dot * 0.16}s` }}
                        />
                    ))}
                </div>
            </div>

            <style>{`
                .decision-loading-aura {
                    position: absolute;
                    width: 18rem;
                    height: 18rem;
                    border-radius: 9999px;
                    filter: blur(64px);
                    pointer-events: none;
                    animation: decision-aura-drift 7s ease-in-out infinite alternate;
                }

                .decision-loading-aura-one {
                    top: 8%;
                    left: -5rem;
                }

                .decision-loading-aura-two {
                    right: -5rem;
                    bottom: 6%;
                    animation-delay: -2.4s;
                }

                .decision-orbit-stage {
                    width: min(48vw, 12.5rem);
                    min-width: 9.75rem;
                    aspect-ratio: 1;
                    display: grid;
                    place-items: center;
                }

                .decision-orbit-shell {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 9999px;
                    display: grid;
                    place-items: center;
                    overflow: hidden;
                    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
                    isolation: isolate;
                }

                .decision-orbit-shell-dark {
                    background: radial-gradient(circle at 50% 45%, rgba(129, 140, 248, 0.28), rgba(15, 23, 42, 0.96) 62%, rgba(2, 6, 23, 0.98));
                    border: 1px solid rgba(199, 210, 254, 0.22);
                }

                .decision-orbit-shell-light {
                    background: radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.96), rgba(238, 242, 255, 0.92) 60%, rgba(226, 232, 240, 0.94));
                    border: 1px solid rgba(100, 116, 139, 0.18);
                }

                .decision-orbit-ring {
                    position: absolute;
                    border-radius: 9999px;
                    border-style: solid;
                    opacity: 0.88;
                }

                .decision-orbit-ring-one {
                    inset: 7%;
                    border-width: 2px;
                    border-color: rgba(129, 140, 248, 0.62) transparent rgba(244, 114, 182, 0.5) transparent;
                    animation: decision-spin 3.8s linear infinite;
                }

                .decision-orbit-ring-two {
                    inset: 19%;
                    border-width: 1px;
                    border-color: transparent rgba(14, 165, 233, 0.52) transparent rgba(250, 204, 21, 0.5);
                    animation: decision-spin-reverse 5.5s linear infinite;
                }

                .decision-orbit-ring-three {
                    inset: 31%;
                    border-width: 2px;
                    border-color: rgba(148, 163, 184, 0.28) rgba(129, 140, 248, 0.7) rgba(148, 163, 184, 0.28) transparent;
                    animation: decision-spin 2.6s cubic-bezier(.65,.05,.36,1) infinite;
                }

                .decision-orbit-grid {
                    width: 42%;
                    aspect-ratio: 1;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.35rem;
                    transform: rotate(45deg);
                }

                .decision-orbit-grid span {
                    border-radius: 0.2rem;
                    background: currentColor;
                    opacity: 0.24;
                    animation: decision-tile 1.7s ease-in-out infinite;
                }

                .decision-orbit-sweep {
                    position: absolute;
                    inset: 0;
                    background: conic-gradient(from 0deg, transparent 0deg, rgba(129, 140, 248, 0.08) 45deg, rgba(255, 255, 255, 0.36) 55deg, transparent 76deg);
                    animation: decision-spin 4.4s linear infinite;
                    mix-blend-mode: screen;
                }

                .decision-orbit-cards {
                    position: absolute;
                    inset: 15%;
                    animation: decision-spin 6.8s linear infinite;
                }

                .decision-orbit-cards-two {
                    inset: 24%;
                    animation: decision-spin-reverse 7.4s linear infinite;
                }

                .decision-orbit-cards i {
                    position: absolute;
                    width: 0.82rem;
                    height: 1.08rem;
                    border-radius: 0.2rem;
                    background: linear-gradient(145deg, rgba(255,255,255,0.9), rgba(129,140,248,0.42));
                    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.24);
                    transform-origin: center;
                }

                .decision-orbit-cards i:nth-child(1) { top: -0.45rem; left: 50%; transform: translateX(-50%) rotate(10deg); }
                .decision-orbit-cards i:nth-child(2) { right: -0.35rem; bottom: 18%; transform: rotate(128deg); }
                .decision-orbit-cards i:nth-child(3) { left: -0.35rem; bottom: 18%; transform: rotate(-128deg); }

                .decision-orbit-core {
                    position: absolute;
                    width: 27%;
                    aspect-ratio: 1;
                    display: grid;
                    place-items: center;
                    border-radius: 9999px;
                    background: radial-gradient(circle, rgba(255,255,255,0.96), rgba(129,140,248,0.72));
                    box-shadow: 0 0 34px rgba(129, 140, 248, 0.58);
                    animation: decision-core-breathe 1.8s ease-in-out infinite;
                }

                .decision-orbit-core span {
                    width: 46%;
                    height: 46%;
                    border-radius: 9999px;
                    background: rgba(79, 70, 229, 0.9);
                }

                .decision-orbit-core b {
                    position: absolute;
                    inset: -42%;
                    border-radius: 9999px;
                    border: 1px solid rgba(129, 140, 248, 0.42);
                    animation: decision-ripple 1.8s ease-out infinite;
                }

                .decision-loading-dot {
                    width: 0.42rem;
                    height: 0.42rem;
                    border-radius: 9999px;
                    animation: decision-dot-wave 1.1s ease-in-out infinite;
                }

                @keyframes decision-spin {
                    to { transform: rotate(360deg); }
                }

                @keyframes decision-spin-reverse {
                    to { transform: rotate(-360deg); }
                }

                @keyframes decision-core-breathe {
                    0%, 100% { transform: scale(0.96); }
                    50% { transform: scale(1.08); }
                }

                @keyframes decision-ripple {
                    0% { transform: scale(0.75); opacity: 0.75; }
                    100% { transform: scale(1.45); opacity: 0; }
                }

                @keyframes decision-tile {
                    0%, 100% { transform: scale(0.72); opacity: 0.18; }
                    50% { transform: scale(1); opacity: 0.72; }
                }

                @keyframes decision-dot-wave {
                    0%, 100% { opacity: 0.28; transform: translateY(0) scale(0.9); }
                    50% { opacity: 1; transform: translateY(-0.28rem) scale(1.15); }
                }

                @keyframes decision-aura-drift {
                    from { transform: translate3d(0, 0, 0) scale(1); }
                    to { transform: translate3d(1.8rem, -1rem, 0) scale(1.12); }
                }

                @media (max-height: 680px) {
                    .decision-orbit-stage {
                        width: min(42vw, 10rem);
                        min-width: 8.25rem;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .decision-loading-aura,
                    .decision-orbit-ring,
                    .decision-orbit-sweep,
                    .decision-orbit-cards,
                    .decision-orbit-core,
                    .decision-orbit-core b,
                    .decision-orbit-grid span,
                    .decision-loading-dot {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                    }
                }
            `}</style>
        </div>
    );
};
