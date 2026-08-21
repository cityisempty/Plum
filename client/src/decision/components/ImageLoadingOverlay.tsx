import React from 'react';
import { ThemeDefinition } from '../themes/types';

interface ImageLoadingOverlayProps {
    isOpen: boolean;
    progress: number;
    theme: ThemeDefinition;
}

export const ImageLoadingOverlay: React.FC<ImageLoadingOverlayProps> = ({ isOpen, progress, theme }) => {
    if (!isOpen) return null;

    const isDark = theme.id === 'modern';

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-black/90' : 'bg-black/60'}`}>
            <div className={`relative w-full max-w-md rounded-2xl shadow-2xl p-8 text-center ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                {/* 加载动画 */}
                <div className="mb-6 flex justify-center">
                    <div className="relative w-20 h-20">
                        {/* 旋转圆环 */}
                        <div className={`absolute inset-0 rounded-full border-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
                        <div
                            className={`absolute inset-0 rounded-full border-4 border-transparent ${isDark ? 'border-t-indigo-500' : 'border-t-slate-800'} animate-spin`}
                            style={{ animationDuration: '1s' }}
                        />
                        {/* 中心百分比 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold">{progress}%</span>
                        </div>
                    </div>
                </div>

                {/* 提示文字 */}
                <h2 className="text-xl font-light mb-2">正在准备卡牌...</h2>
                <p className="text-sm opacity-70">请稍候,马上就好</p>

                {/* 进度条 */}
                <div className={`mt-6 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div
                        className={`h-full transition-all duration-300 ${isDark ? 'bg-indigo-500' : 'bg-slate-800'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
