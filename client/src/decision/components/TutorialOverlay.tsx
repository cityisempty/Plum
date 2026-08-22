import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface TutorialOverlayProps {
    onClose: () => void;
    onRestart?: () => void;
    theme?: 'classic' | 'modern';
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose, theme = 'classic' }) => {
    // Prevent scrolling of background when overlay is active
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    // 主题样式
    const bgClass = theme === 'classic' ? 'bg-white' : 'bg-slate-800';
    const textClass = theme === 'classic' ? 'text-slate-900' : 'text-slate-100';
    const hoverBgClass = theme === 'classic' ? 'hover:bg-gray-200' : 'hover:bg-slate-700';
    const buttonClass = theme === 'classic'
        ? 'bg-slate-900 hover:bg-slate-800 text-white'
        : 'bg-indigo-600 hover:bg-indigo-500 text-white';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60">
            <div className={`${bgClass} ${textClass} rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative animate-in fade-in duration-300`}>
                <button
                    onClick={onClose}
                    className={`absolute top-2 right-2 p-1 rounded-full ${hoverBgClass}`}
                    aria-label="关闭引导"
                >
                    <X size={20} />
                </button>
                <h2 className="text-xl font-medium mb-4 text-center">使用指引</h2>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>长按卡牌以选择并进入摆放模式。</li>
                    <li>在九宫格中点击空位放置卡牌，使用下方按钮翻转或确认。</li>
                    <li>只需三张卡牌就能对您的决策投射进行判断</li>
                    <li>开始使用就意味着您已阅读并同意用户协议</li>
                </ol>
                <p className="text-xs text-orange-500 mt-2">
                    该功能仅供娱乐，不具有任何决策参考意义，不作为任何评价分析依据，我们不对任何输出结果负责。
                </p>
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-full transition ${buttonClass}`}
                    >
                        开始使用
                    </button>
                </div>
            </div>
        </div>
    );
};
