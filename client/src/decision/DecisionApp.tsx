import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ALL_CARDS, MAX_SELECTIONS } from './constants';
import { AppPhase, PlacedCard, ThemeId } from './types';
import { CardView } from './components/CardView';
import { PlacementGrid } from './components/PlacementGrid';
import { interpretSpread } from './services/geminiService';
import { getPromptVersionIds } from './services/prompts/templates/registry';
import { ArrowLeft, Sparkles, RotateCcw, Palette, HelpCircle, X } from 'lucide-react';
import { getTheme, DEFAULT_THEME_ID } from './themes';
import { TutorialOverlay } from './components/TutorialOverlay';
import { CardData } from './types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { LoadingAnimation } from './components/LoadingAnimation';
import { UserInfoPage, UserInfo } from './components/UserInfoPage';
import { imagePreloader } from './services/imagePreloader';
import { ImageLoadingOverlay } from './components/ImageLoadingOverlay';
import { PolicyDialog } from './components/PolicyDialog';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function DecisionApp() {
    const { user, loading, setUser } = useAuth();
    const [phase, setPhase] = useState<AppPhase>(AppPhase.WELCOME);
    const [placedCards, setPlacedCards] = useState<PlacedCard[]>([]);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [reading, setReading] = useState('');
    const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(DEFAULT_THEME_ID as ThemeId);
    const [showTutorial, setShowTutorial] = useState<boolean>(false);
    // Shuffled cards for each session
    const [shuffledCards, setShuffledCards] = useState<CardData[]>([]);
    // User info
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    // 图片预加载进度
    const [imageLoadProgress, setImageLoadProgress] = useState(0);
    const [showImageLoading, setShowImageLoading] = useState(false);
    // 政策弹窗状态
    const [showPolicyDialog, setShowPolicyDialog] = useState(false);
    const [policyType, setPolicyType] = useState<'terms' | 'privacy'>('terms');
    // 预览卡牌状态
    const [previewingCardId, setPreviewingCardId] = useState<string | null>(null);
    // Prompt 对比模式
    const isCompareMode = new URLSearchParams(window.location.search).has('compare');
    const [compareResults, setCompareResults] = useState<Record<string, { loading: boolean; content: string }>>({});
    const [activeTab, setActiveTab] = useState<string>('current');

    // Utility to shuffle an array
    const shuffleArray = <T,>(array: T[]): T[] => {
        const copy = [...array];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    };

    // Initialize shuffled cards on mount
    useEffect(() => {
        setShuffledCards(shuffleArray(ALL_CARDS));
    }, []);

    // WELCOME阶段:加载默认头像后自动进入USER_INFO阶段
    useEffect(() => {
        if (phase !== AppPhase.WELCOME) return;

        const loadDefaultAvatars = async () => {
            // 加载默认头像(男女各35岁)
            const { avatarPreloader } = await import('./services/avatarPreloader');
            await avatarPreloader.preloadDefaultAvatars();
            console.log('[Avatar] 默认头像加载完成');

            // 自动进入USER_INFO阶段
            setPhase(AppPhase.USER_INFO);
        };

        loadDefaultAvatars();
    }, [phase]);

    // USER_INFO阶段:启动卡牌图片预加载
    useEffect(() => {
        if (phase !== AppPhase.USER_INFO) return;

        const imageUrls = ALL_CARDS.map(card => card.imageUrl);

        // 订阅进度更新
        const unsubscribe = imagePreloader.onProgress((progress) => {
            setImageLoadProgress(progress.percentage);
        });

        // 开始预加载卡牌(前20张优先,每批5张)
        imagePreloader.preloadImages(imageUrls, 20, 5);

        // 清理订阅
        return () => {
            unsubscribe();
        };
    }, [phase]);


    const activeTheme = getTheme(currentThemeId);



    // Initialize tutorial visibility based on localStorage
    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenTutorial');
        if (!hasSeen) {
            setShowTutorial(true);
        }
    }, []);

    useEffect(() => {
        if (!loading && !user) api.wechatStart('/apps/decision');
    }, [loading, user]);

    const handleCloseTutorial = () => {
        setShowTutorial(false);
        localStorage.setItem('hasSeenTutorial', 'true');
    };

    const handleRestartTutorial = () => {
        localStorage.removeItem('hasSeenTutorial');
        setShowTutorial(true);
    };

    const handleCardLongPress = (cardId: string) => {
        setPreviewingCardId(null); // 如果是从预览中确认的，关闭预览
        setActiveCardId(cardId);
        setPhase(AppPhase.PLACEMENT);
    };

    const handleCardClick = (cardId: string) => {
        setPreviewingCardId(cardId);
    };

    const handleConfirmPlacement = (placement: PlacedCard) => {
        const filtered = placedCards.filter(p => p.cardId !== placement.cardId);
        const newPlacements = [...filtered, placement];
        setPlacedCards(newPlacements);
        if (newPlacements.length >= MAX_SELECTIONS) {
            setPhase(AppPhase.REVIEW);
        } else {
            setPhase(AppPhase.SELECTION);
        }
        setActiveCardId(null);
    };

    const handleCancelPlacement = () => {
        setActiveCardId(null);
        setPhase(AppPhase.SELECTION);
    };

    const handleSubmit = async () => {
        if (!user) {
            api.wechatStart('/apps/decision');
            return;
        }
        setPhase(AppPhase.ANALYSIS);

        if (isCompareMode) {
            // 对比模式：并行调用所有 prompt 版本
            const versions = getPromptVersionIds();
            const initialResults: Record<string, { loading: boolean; content: string }> = {};
            versions.forEach(v => { initialResults[v] = { loading: true, content: '' }; });
            setCompareResults(initialResults);
            setActiveTab(versions[0]);
            setPhase(AppPhase.RESULT);

            // 并行请求所有版本
            versions.forEach(async (version) => {
                try {
                    let text = '';
                    let lastUpdateTime = 0;
                    const result = await interpretSpread(placedCards, ALL_CARDS, userInfo || undefined, version, (chunk) => {
                        if (!chunk) return;
                        text += chunk;
                        const now = Date.now();
                        if (now - lastUpdateTime > 80) {
                            setCompareResults(prev => ({
                                ...prev,
                                [version]: { loading: false, content: text }
                            }));
                            lastUpdateTime = now;
                        }
                    });
                    // 确保最后一次完整写入
                    setCompareResults(prev => ({
                        ...prev,
                        [version]: { loading: false, content: result.interpretation || text }
                    }));
                    setUser({ ...user, points: result.pointsRemaining });
                } catch (err) {
                    setCompareResults(prev => ({
                        ...prev,
                        [version]: { loading: false, content: `请求失败: ${err instanceof Error ? err.message : '未知错误'}` }
                    }));
                }
            });
        } else {
            // 正常模式：单个请求流式输出
            let started = false;
            let text = '';
            let lastUpdateTime = 0;

            try {
                const result = await interpretSpread(placedCards, ALL_CARDS, userInfo || undefined, undefined, (chunk) => {
                    if (!chunk) return; // 忽略无内容的控制事件
                    text += chunk;

                    // 凑够足够字数再跳转，防止第一句是不可见的 Markdown 占位符
                    if (!started && text.trim().length > 10) {
                        started = true;
                        setPhase(AppPhase.RESULT);
                    }

                    if (started) {
                        const now = Date.now();
                        // 限流 80ms，避免极高频刷新把 React-Markdown 渲染卡死
                        if (now - lastUpdateTime > 80) {
                            setReading(text);
                            lastUpdateTime = now;
                        }
                    }
                });

                if (!started) {
                    setPhase(AppPhase.RESULT);
                }
                // 生成完毕后，确保补齐最后一小段没有触发限流的文字
                setReading(result.interpretation || text);
                setUser({ ...user, points: result.pointsRemaining });
            } catch (err) {
                setReading(`解读服务出错: ${err instanceof Error ? err.message : '未知错误'}`);
                setPhase(AppPhase.RESULT);
            }
        }

    };

    const handleUserInfoSubmit = (info: UserInfo) => {
        setUserInfo(info);
        localStorage.setItem('userInfo', JSON.stringify(info));

        // 重置游戏状态(如果是重新评估)
        if (phase === AppPhase.USER_INFO) {
            setPlacedCards([]);
            setActiveCardId(null);
            setReading('');
            setShuffledCards(shuffleArray(ALL_CARDS));
        }

        // 检查卡牌是否加载完成
        const currentProgress = imagePreloader.getProgress();
        if (!currentProgress.isComplete) {
            // 显示加载等待界面
            setShowImageLoading(true);

            // 监听加载完成
            const checkProgress = () => {
                const progress = imagePreloader.getProgress();
                setImageLoadProgress(progress.percentage);
                if (progress.isComplete) {
                    setShowImageLoading(false);
                    setPhase(AppPhase.SELECTION);
                } else {
                    // 继续检查
                    setTimeout(checkProgress, 100);
                }
            };
            checkProgress();
        } else {
            // 卡牌已加载完成,直接进入选择阶段
            setPhase(AppPhase.SELECTION);
        }
    };

    const handleReset = () => {
        // 重置到USER_INFO阶段
        setPhase(AppPhase.USER_INFO);
    };

    const toggleTheme = () => {
        setCurrentThemeId(prev => (prev === 'classic' ? 'modern' : 'classic'));
    };

    const handleShowPolicy = (type: 'terms' | 'privacy') => {
        setPolicyType(type);
        setShowPolicyDialog(true);
    };

    const selectionsLeft = MAX_SELECTIONS - placedCards.length;

    return (
        <div className={`h-full font-sans relative overflow-hidden flex flex-col ${activeTheme.appBackgroundClass} transition-colors duration-500`}>
            {/* Image Loading Overlay */}
            <ImageLoadingOverlay
                isOpen={showImageLoading}
                progress={imageLoadProgress}
                theme={activeTheme}
            />

            {showTutorial && <TutorialOverlay onClose={handleCloseTutorial} theme={currentThemeId} />}

            {/* 政策弹窗 */}
            <PolicyDialog
                isOpen={showPolicyDialog}
                onClose={() => setShowPolicyDialog(false)}
                type={policyType}
                theme={currentThemeId}
            />

            {/* 卡牌详情预览 */}
            {previewingCardId && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300"
                    onClick={() => {
                        setPreviewingCardId(null);
                    }}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                    <div
                        className={`relative w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border ${currentThemeId === 'classic' ? 'bg-white border-slate-100' : 'bg-slate-900 border-white/10'}`}
                        onClick={(e) => {
                            // 关键：阻止点击内部卡牌区域时冒泡到背景，从而避免误关
                            e.stopPropagation();
                        }}
                    >
                        <div className="relative">
                            {/* 关闭按钮 */}
                            <button
                                onClick={() => setPreviewingCardId(null)}
                                className="absolute top-6 right-6 z-20 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors backdrop-blur-md"
                            >
                                <X size={20} />
                            </button>

                            {/* 卡牌展示 */}
                            <div className="p-8 flex flex-col items-center justify-center pt-14">
                                <div className="w-full flex justify-center">
                                    <div className="w-[85%] shadow-2xl rounded-2xl overflow-hidden ring-4 ring-white/10 transition-transform hover:scale-[1.02] duration-500">
                                        <img
                                            src={ALL_CARDS.find(c => c.id === previewingCardId)?.imageUrl}
                                            alt="Card Preview"
                                            className="w-full h-auto block object-contain"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 操作栏 */}
                            <div className={`p-8 border-t mt-4 ${currentThemeId === 'classic' ? 'bg-slate-50 border-slate-100' : 'bg-slate-950 border-white/5'}`}>
                                <button
                                    onClick={() => handleCardLongPress(previewingCardId)}
                                    className={`w-full py-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-bold tracking-widest uppercase text-sm ${currentThemeId === 'classic' ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}
                                >
                                    <Sparkles size={18} /> 确认选择此牌
                                </button>
                                <button
                                    onClick={() => setPreviewingCardId(null)}
                                    className={`w-full mt-4 py-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity ${currentThemeId === 'classic' ? 'text-slate-900' : 'text-white'}`}
                                >
                                    返回预览列表
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* 背景渐变 */}
            <div className="fixed inset-0 pointer-events-none">
                {currentThemeId === 'classic' ? (
                    <>
                        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-100/50 rounded-full blur-[100px]" />
                        <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-100/50 rounded-full blur-[80px]" />
                    </>
                ) : (
                    <>
                        <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-900/20 rounded-full blur-[100px]" />
                        <div className="absolute top-40 -left-20 w-72 h-72 bg-fuchsia-900/20 rounded-full blur-[80px]" />
                    </>
                )}
            </div>

            {/* 主容器 */}
        <div className={`decision-app relative z-10 flex flex-col h-full w-full max-w-2xl mx-auto shadow-2xl border-x ${currentThemeId === 'classic' ? 'bg-white/50 border-white/60' : 'bg-slate-900/50 border-white/5'}`}>
                {/* Header */}
                <header className={`flex-none px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 backdrop-blur-md sticky top-0 z-30 border-b ${currentThemeId === 'classic' ? 'bg-white/80 border-slate-100' : 'bg-slate-900/80 border-white/10 text-white'}`}>
                    <Link
                        to="/"
                        className="decision-back flex-none p-2 rounded-full hover:bg-black/5 active:scale-95 transition-all"
                        title="返回主页面"
                        aria-label="返回主页面"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="min-w-0 flex-1 text-base sm:text-xl font-light tracking-widest uppercase flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                        测测<span className="font-bold">你的决策模型</span>
                    </h1>
                    <div className="flex flex-none items-center gap-2 sm:gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-black/5 active:scale-95 transition-all"
                            title="切换主题"
                        >
                            <Palette size={20} />
                        </button>
                        <button
                            onClick={handleRestartTutorial}
                            className="p-2 rounded-full hover:bg-black/5 active:scale-95 transition-all"
                            title="帮助 / 重新演示"
                        >
                            <HelpCircle size={20} />
                        </button>
                        <div className="flex gap-2">
                            {Array.from({ length: MAX_SELECTIONS }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${i < placedCards.length ? (currentThemeId === 'classic' ? 'bg-slate-800' : 'bg-white') : (currentThemeId === 'classic' ? 'bg-slate-200' : 'bg-slate-700')}`}
                                />
                            ))}
                        </div>
                    </div>
                </header>

                {/* WELCOME阶段 - 极简加载页面 */}
                {phase === AppPhase.WELCOME && (
                    <main className="flex-1 flex items-center justify-center p-6">
                        <div className="text-center space-y-6">
                            <div className={`text-4xl font-light tracking-widest ${currentThemeId === 'classic' ? 'text-slate-800' : 'text-white'}`}>
                                决策模式评测
                            </div>
                            <div className={`text-sm ${currentThemeId === 'classic' ? 'text-slate-500' : 'text-slate-400'}`}>
                                正在加载...
                            </div>
                        </div>
                    </main>
                )}

                {/* USER_INFO阶段 - 用户信息输入页面 */}
                {phase === AppPhase.USER_INFO && (
                    <UserInfoPage
                        onSubmit={handleUserInfoSubmit}
                        theme={activeTheme}
                        initialValues={
                            userInfo ||
                            (localStorage.getItem('userInfo')
                                ? JSON.parse(localStorage.getItem('userInfo')!)
                                : undefined)
                        }
                        isReassessment={userInfo !== null}
                        loadingProgress={imageLoadProgress}
                    />
                )}

                {/* 选择阶段 */}
                {phase === AppPhase.SELECTION && (
                    <main className="flex-1 overflow-y-auto no-scrollbar p-6">
                        <div className="text-center mb-6">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentThemeId === 'classic' ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>
                                点击卡牌预览, 确认后放置到九宫格中, 还需 {selectionsLeft} 张
                            </span>
                        </div>
                        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 pb-20">
                            {shuffledCards.map(card => {
                                const isPlaced = placedCards.some(p => p.cardId === card.id);
                                return (
                                    <CardView
                                        key={card.id}
                                        card={card}
                                        isSelected={isPlaced}
                                        isDisabled={isPlaced || placedCards.length >= MAX_SELECTIONS}
                                        onLongPress={handleCardLongPress}
                                        onClick={handleCardClick}
                                        theme={activeTheme}
                                    />
                                );
                            })}
                        </div>
                    </main>
                )}

                {/* 放置/复审阶段 */}
                {(phase === AppPhase.PLACEMENT || phase === AppPhase.REVIEW) && (
                    <PlacementGrid
                        currentCard={activeCardId ? ALL_CARDS.find(c => c.id === activeCardId) : null}
                        existingPlacements={placedCards}
                        onConfirmPlacement={handleConfirmPlacement}
                        onCancel={handleCancelPlacement}
                        isReviewMode={phase === AppPhase.REVIEW}
                        onSubmitReading={handleSubmit}
                        theme={activeTheme}
                    />
                )}

                {/* 分析阶段 */}
                {phase === AppPhase.ANALYSIS && (
                    <LoadingAnimation theme={currentThemeId} />
                )}

                {/* 结果阶段 */}
                {phase === AppPhase.RESULT && (
                    <main className={`flex-1 overflow-y-auto no-scrollbar relative animate-in fade-in duration-500 ${currentThemeId === 'classic' ? 'bg-white' : 'bg-slate-900 text-slate-200'}`}>
                        {/* 牌阵回顾 */}
                        <div className={`w-full p-8 shadow-inner flex flex-col items-center justify-center ${currentThemeId === 'classic' ? 'bg-slate-50' : 'bg-slate-950'}`}>
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                {Array.from({ length: 9 }).map((_, i) => {
                                    const placed = placedCards.find(p => p.gridIndex === i);
                                    const cardInfo = placed ? ALL_CARDS.find(c => c.id === placed.cardId) : null;
                                    const Mini = activeTheme.MiniCard;
                                    if (!placed) {
                                        return <div key={i} className={`w-24 h-32 rounded-xl border-2 border-dashed ${currentThemeId === 'classic' ? 'border-slate-200' : 'border-slate-800'}`} />;
                                    }
                                    return (
                                        <div key={i} className="w-24 h-32">
                                            <Mini card={cardInfo!} isFaceUp={placed.isFaceUp} />
                                        </div>
                                    );
                                })}
                            </div>
                            <h2 className="text-2xl font-light uppercase tracking-widest opacity-90">
                                {isCompareMode ? 'Prompt 对比测试' : '解读结果'}
                            </h2>
                        </div>

                        {/* 对比模式 Tab 切换 */}
                        {isCompareMode && (
                            <div className={`sticky top-0 z-20 backdrop-blur-md border-b ${currentThemeId === 'classic' ? 'bg-white/90 border-slate-200' : 'bg-slate-900/90 border-slate-700'}`}>
                                <div className="flex overflow-x-auto no-scrollbar px-4 py-2 gap-1">
                                    {getPromptVersionIds().map(v => {
                                        const isActive = activeTab === v;
                                        const isLoading = compareResults[v]?.loading;
                                        return (
                                            <button
                                                key={v}
                                                onClick={() => setActiveTab(v)}
                                                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${isActive
                                                    ? (currentThemeId === 'classic' ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white')
                                                    : (currentThemeId === 'classic' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')
                                                    }`}
                                            >
                                                {isLoading && (
                                                    <span className="inline-block w-3 h-3 mr-1.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                )}
                                                {v}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 文本内容 */}
                        <div className="px-8 py-10 max-w-xl mx-auto pb-32 overflow-hidden">
                            <div className={`prose prose-lg prose-headings:font-light max-w-none leading-relaxed ${currentThemeId === 'classic' ? 'prose-slate' : 'prose-invert'}`}
                                style={{ lineHeight: '1.9', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                            >
                                {isCompareMode ? (
                                    // 对比模式
                                    compareResults[activeTab]?.loading ? (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <div className="w-8 h-8 border-3 border-current border-t-transparent rounded-full animate-spin mb-4" />
                                            <p className="text-sm opacity-60">{activeTab} 版本生成中...</p>
                                        </div>
                                    ) : (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeRaw]}
                                            components={{
                                                p: ({ node, ...props }) => <p style={{ marginBottom: '1.5em' }} {...props} />,
                                                h1: ({ node, ...props }) => <h1 style={{ marginTop: '2em', marginBottom: '1em' }} {...props} />,
                                                h2: ({ node, ...props }) => <h2 style={{ marginTop: '2em', marginBottom: '1em' }} {...props} />,
                                                h3: ({ node, ...props }) => <h3 style={{ marginTop: '1.8em', marginBottom: '0.8em' }} {...props} />,
                                                h4: ({ node, ...props }) => <h4 style={{ marginTop: '1.5em', marginBottom: '0.6em' }} {...props} />,
                                                ul: ({ node, ...props }) => <ul style={{ marginBottom: '1.5em', lineHeight: '2' }} {...props} />,
                                                ol: ({ node, ...props }) => <ol style={{ marginBottom: '1.5em', lineHeight: '2' }} {...props} />,
                                                li: ({ node, ...props }) => <li style={{ marginBottom: '0.5em' }} {...props} />,
                                                table: ({ node, ...props }) => <div style={{ overflowX: 'auto', width: '100%' }}><table {...props} /></div>,
                                                pre: ({ node, ...props }) => <pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} {...props} />,
                                            }}
                                        >
                                            {compareResults[activeTab]?.content || ''}
                                        </ReactMarkdown>
                                    )
                                ) : (
                                    // 正常模式
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            p: ({ node, ...props }) => <p style={{ marginBottom: '1.5em' }} {...props} />,
                                            h1: ({ node, ...props }) => <h1 style={{ marginTop: '2em', marginBottom: '1em' }} {...props} />,
                                            h2: ({ node, ...props }) => <h2 style={{ marginTop: '2em', marginBottom: '1em' }} {...props} />,
                                            h3: ({ node, ...props }) => <h3 style={{ marginTop: '1.8em', marginBottom: '0.8em' }} {...props} />,
                                            h4: ({ node, ...props }) => <h4 style={{ marginTop: '1.5em', marginBottom: '0.6em' }} {...props} />,
                                            ul: ({ node, ...props }) => <ul style={{ marginBottom: '1.5em', lineHeight: '2' }} {...props} />,
                                            ol: ({ node, ...props }) => <ol style={{ marginBottom: '1.5em', lineHeight: '2' }} {...props} />,
                                            li: ({ node, ...props }) => <li style={{ marginBottom: '0.5em' }} {...props} />,
                                            table: ({ node, ...props }) => <div style={{ overflowX: 'auto', width: '100%' }}><table {...props} /></div>,
                                            pre: ({ node, ...props }) => <pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} {...props} />,
                                        }}
                                    >
                                        {reading}
                                    </ReactMarkdown>
                                )}
                            </div>
                        </div>
                        {/* 底部按钮 */}
                        <div className={`fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t z-30 flex justify-center max-w-2xl mx-auto pointer-events-none ${currentThemeId === 'classic' ? 'from-white to-transparent' : 'from-slate-900 to-transparent'}`}>
                            <button
                                onClick={handleReset}
                                className={`pointer-events-auto px-8 py-3 rounded-full shadow-xl hover:scale-105 transition-all flex items-center gap-2 ${currentThemeId === 'classic' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
                                <RotateCcw size={16} /> <span className="uppercase tracking-widest text-xs font-bold">重新评估</span>
                            </button>
                        </div>
                    </main>
                )}

                {/* Footer */}
                <footer className={`text-center text-xs py-3 border-t ${currentThemeId === 'classic' ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                    <div className="max-w-2xl mx-auto">
                        © 2025 心点通. All rights reserved. |
                        <button
                            onClick={() => handleShowPolicy('terms')}
                            className="ml-2 underline hover:opacity-70 cursor-pointer"
                        >
                            用户协议
                        </button> |
                        <button
                            onClick={() => handleShowPolicy('privacy')}
                            className="ml-2 underline hover:opacity-70 cursor-pointer"
                        >
                            隐私政策
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
