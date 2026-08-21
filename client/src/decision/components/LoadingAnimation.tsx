import React, { useState, useEffect } from 'react';

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

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ theme }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const messageInterval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
                setIsVisible(true);
            }, 300);
        }, 2500);

        return () => clearInterval(messageInterval);
    }, []);

    const isDark = theme === 'modern';

    return (
        <div className={`flex-1 flex flex-col items-center justify-center space-y-8 backdrop-blur-sm absolute inset-0 z-50 ${isDark ? 'bg-black/80 text-white' : 'bg-white/80'}`}>
            {/* 动态线条图案 */}
            <div className="relative w-32 h-32">
                <svg
                    className="w-full h-full"
                    viewBox="0 0 100 100"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* 外圈旋转线条 */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={isDark ? '#818cf8' : '#334155'}
                        strokeWidth="1"
                        strokeDasharray="10 5"
                        opacity="0.3"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 50 50"
                            to="360 50 50"
                            dur="8s"
                            repeatCount="indefinite"
                        />
                    </circle>

                    {/* 中圈反向旋转 */}
                    <circle
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke={isDark ? '#a78bfa' : '#475569'}
                        strokeWidth="1.5"
                        strokeDasharray="5 3"
                        opacity="0.5"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="360 50 50"
                            to="0 50 50"
                            dur="6s"
                            repeatCount="indefinite"
                        />
                    </circle>

                    {/* 内圈快速旋转 */}
                    <circle
                        cx="50"
                        cy="50"
                        r="25"
                        fill="none"
                        stroke={isDark ? '#c084fc' : '#64748b'}
                        strokeWidth="2"
                        strokeDasharray="3 2"
                        opacity="0.7"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 50 50"
                            to="360 50 50"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </circle>

                    {/* 中心脉动圆 */}
                    <circle
                        cx="50"
                        cy="50"
                        r="8"
                        fill={isDark ? '#818cf8' : '#334155'}
                        opacity="0.8"
                    >
                        <animate
                            attributeName="r"
                            values="8;12;8"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="opacity"
                            values="0.8;0.4;0.8"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>

                    {/* 连接线条 - 形成网格效果 */}
                    <line
                        x1="50"
                        y1="5"
                        x2="50"
                        y2="25"
                        stroke={isDark ? '#818cf8' : '#334155'}
                        strokeWidth="1"
                        opacity="0.4"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.4;0.8;0.4"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                    </line>
                    <line
                        x1="50"
                        y1="75"
                        x2="50"
                        y2="95"
                        stroke={isDark ? '#818cf8' : '#334155'}
                        strokeWidth="1"
                        opacity="0.4"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.4;0.8;0.4"
                            dur="3s"
                            begin="0.5s"
                            repeatCount="indefinite"
                        />
                    </line>
                    <line
                        x1="5"
                        y1="50"
                        x2="25"
                        y2="50"
                        stroke={isDark ? '#818cf8' : '#334155'}
                        strokeWidth="1"
                        opacity="0.4"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.4;0.8;0.4"
                            dur="3s"
                            begin="1s"
                            repeatCount="indefinite"
                        />
                    </line>
                    <line
                        x1="75"
                        y1="50"
                        x2="95"
                        y2="50"
                        stroke={isDark ? '#818cf8' : '#334155'}
                        strokeWidth="1"
                        opacity="0.4"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.4;0.8;0.4"
                            dur="3s"
                            begin="1.5s"
                            repeatCount="indefinite"
                        />
                    </line>

                    {/* 对角线 */}
                    <line
                        x1="20"
                        y1="20"
                        x2="35"
                        y2="35"
                        stroke={isDark ? '#a78bfa' : '#475569'}
                        strokeWidth="1"
                        opacity="0.3"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.3;0.7;0.3"
                            dur="4s"
                            repeatCount="indefinite"
                        />
                    </line>
                    <line
                        x1="65"
                        y1="65"
                        x2="80"
                        y2="80"
                        stroke={isDark ? '#a78bfa' : '#475569'}
                        strokeWidth="1"
                        opacity="0.3"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.3;0.7;0.3"
                            dur="4s"
                            begin="1s"
                            repeatCount="indefinite"
                        />
                    </line>
                    <line
                        x1="80"
                        y1="20"
                        x2="65"
                        y2="35"
                        stroke={isDark ? '#a78bfa' : '#475569'}
                        strokeWidth="1"
                        opacity="0.3"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.3;0.7;0.3"
                            dur="4s"
                            begin="2s"
                            repeatCount="indefinite"
                        />
                    </line>
                    <line
                        x1="35"
                        y1="65"
                        x2="20"
                        y2="80"
                        stroke={isDark ? '#a78bfa' : '#475569'}
                        strokeWidth="1"
                        opacity="0.3"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.3;0.7;0.3"
                            dur="4s"
                            begin="3s"
                            repeatCount="indefinite"
                        />
                    </line>
                </svg>
            </div>

            {/* 滚动文字 */}
            <div className="h-8 overflow-hidden relative">
                <p
                    className={`font-medium text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                        }`}
                >
                    {LOADING_MESSAGES[currentMessageIndex]}
                </p>
            </div>

            {/* 进度指示点 */}
            <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-indigo-400' : 'bg-slate-600'
                            }`}
                        style={{
                            animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
};
