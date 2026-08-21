import React, { useState, useRef, useEffect } from 'react';
import { ThemeDefinition } from '../themes/types';
import { AvatarImage } from './AvatarImage';

export interface UserInfo {
    gender: 'male' | 'female';
    age: number;
    topic: string;
}

interface UserInfoPageProps {
    onSubmit: (userInfo: UserInfo) => void;
    theme: ThemeDefinition;
    initialValues?: UserInfo;
    isReassessment?: boolean;
    loadingProgress: number; // 图片加载进度 0-100
}

// 智能提示数据 - 覆盖生活中常见的决策场景
const TOPIC_SUGGESTIONS = [
    // 财富金钱类
    {
        keywords: ['财', '钱', '富', '资', '投', '股', '基', '存', '贷', '债'],
        suggestions: [
            '我要不要投资这个项目',
            '要不要买股票/基金',
            '该不该贷款',
            '要不要换工作涨薪水',
            '该怎么理财存钱',
            '要不要和朋友合伙做生意'
        ]
    },
    // 情感关系类
    {
        keywords: ['情', '爱', '恋', '婚', '感', '分', '复', '离', '约', '表白'],
        suggestions: [
            '要不要和TA在一起',
            '该不该表白',
            '要不要结婚',
            '该不该分手',
            '要不要复合',
            '该不该离婚',
            '要不要接受TA的追求'
        ]
    },
    // 房产居住类
    {
        keywords: ['房', '屋', '居', '住', '租', '装', '搬'],
        suggestions: [
            '要不要买房',
            '该不该卖房',
            '要不要换房',
            '该租房还是买房',
            '要不要搬家',
            '该不该装修房子'
        ]
    },
    // 职业发展类
    {
        keywords: ['工', '职', '业', '事', '跳', '辞', '创', '升', '转'],
        suggestions: [
            '要不要跳槽',
            '该不该辞职',
            '要不要创业',
            '该不该接受这个offer',
            '要不要转行',
            '该不该争取晋升',
            '要不要考公务员'
        ]
    },
    // 学习进修类
    {
        keywords: ['学', '习', '进', '修', '考', '研', '证', '培', '课'],
        suggestions: [
            '要不要考研',
            '该不该出国留学',
            '要不要考这个证书',
            '该不该报培训班',
            '要不要学这个技能',
            '该不该读在职研究生'
        ]
    },
    // 家庭关系类
    {
        keywords: ['家', '庭', '亲', '父', '母', '子', '女', '孩', '生'],
        suggestions: [
            '要不要生孩子',
            '该不该要二胎',
            '要不要和父母同住',
            '该怎么处理婆媳关系',
            '要不要让孩子上这个学校',
            '该不该给父母买房'
        ]
    },
    // 健康养生类
    {
        keywords: ['健', '康', '养', '病', '医', '治', '疗', '手术'],
        suggestions: [
            '要不要做这个手术',
            '该不该换医生/医院',
            '要不要开始健身',
            '该不该做体检',
            '要不要尝试这个治疗方案'
        ]
    },
    // 社交人际类
    {
        keywords: ['友', '朋', '交', '社', '圈', '群', '同', '合'],
        suggestions: [
            '要不要和TA继续做朋友',
            '该不该加入这个圈子',
            '要不要参加这个聚会',
            '该不该和TA合作',
            '要不要断绝这段关系'
        ]
    },
    // 消费购物类
    {
        keywords: ['买', '购', '换', '车', '物', '奢', '省'],
        suggestions: [
            '要不要买车',
            '该不该换车',
            '要不要买这个奢侈品',
            '该不该现在买',
            '要不要分期付款'
        ]
    },
    // 旅行出行类
    {
        keywords: ['旅', '游', '行', '玩', '假', '出'],
        suggestions: [
            '要不要去旅行',
            '该去哪里旅游',
            '要不要辞职去旅行',
            '该不该带孩子出国玩',
            '要不要参加这个旅行团'
        ]
    },
    // 移民定居类
    {
        keywords: ['移', '民', '国', '外', '定', '居', '签'],
        suggestions: [
            '要不要移民',
            '该不该出国定居',
            '要不要申请这个国家',
            '该不该放弃国内的一切'
        ]
    },
    // 生活方式类
    {
        keywords: ['生活', '方式', '改', '变', '习惯'],
        suggestions: [
            '要不要改变生活方式',
            '该不该早睡早起',
            '要不要戒掉这个习惯',
            '该不该养宠物'
        ]
    },
    // 兴趣爱好类
    {
        keywords: ['兴', '趣', '爱', '好', '玩', '乐'],
        suggestions: [
            '要不要培养这个爱好',
            '该不该花钱学这个',
            '要不要参加这个兴趣班'
        ]
    },
    // 时间管理类
    {
        keywords: ['时', '间', '忙', '闲', '安排'],
        suggestions: [
            '该怎么安排我的时间',
            '要不要接这个任务',
            '该不该推掉这个约会'
        ]
    },
    // 风险决策类
    {
        keywords: ['险', '赌', '冒', '试', '尝'],
        suggestions: [
            '要不要冒这个险',
            '该不该尝试',
            '要不要赌一把',
            '该不该抓住这个机会'
        ]
    },
    // 法律纠纷类
    {
        keywords: ['法', '律', '诉', '讼', '官', '司', '纠'],
        suggestions: [
            '要不要打官司',
            '该不该起诉',
            '要不要和解',
            '该不该请律师'
        ]
    },
    // 保险理赔类
    {
        keywords: ['保', '险', '赔'],
        suggestions: [
            '要不要买保险',
            '该买哪种保险',
            '要不要申请理赔'
        ]
    },
    // 借贷关系类
    {
        keywords: ['借', '贷', '欠', '还'],
        suggestions: [
            '要不要借钱给TA',
            '该不该向TA借钱',
            '要不要催TA还钱',
            '该不该先还这笔钱'
        ]
    },
    // 合同协议类
    {
        keywords: ['合', '同', '约', '签', '协议'],
        suggestions: [
            '要不要签这个合同',
            '该不该违约',
            '要不要续约',
            '该不该接受这个条件'
        ]
    },
    // 退休养老类
    {
        keywords: ['退', '休', '养', '老', '晚年'],
        suggestions: [
            '要不要提前退休',
            '该怎么规划养老',
            '要不要去养老院',
            '该不该买养老保险'
        ]
    }
];

// 根据年龄映射到年龄段
function getAgeGroup(age: number): number {
    if (age < 26) return 20;
    if (age < 36) return 30;
    if (age < 46) return 40;
    if (age < 56) return 50;
    if (age < 66) return 60;
    return 70;
}

export const UserInfoPage: React.FC<UserInfoPageProps> = ({
    onSubmit,
    theme,
    initialValues,
    isReassessment = false,
    loadingProgress
}) => {
    const [gender, setGender] = useState<'male' | 'female' | null>(initialValues?.gender || null);
    const [age, setAge] = useState(initialValues?.age || 35);
    const [topic, setTopic] = useState('');  // 主题始终为空,每次都要求用户输入
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const suggestionRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (suggestionRef.current && !suggestionRef.current.contains(target) &&
                inputRef.current && !inputRef.current.contains(target)) {
                setSuggestions([]);
            }
        };
        const keyHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSuggestions([]);
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('keydown', keyHandler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('keydown', keyHandler);
        };
    }, []);

    const ageGroup = getAgeGroup(age);

    // 智能提示匹配
    const handleTopicChange = (value: string) => {
        setTopic(value);
        if (value.length > 0) {
            const matched = TOPIC_SUGGESTIONS.filter(item =>
                item.keywords.some(keyword => value.includes(keyword))
            );
            setSuggestions(matched.flatMap(m => m.suggestions).slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    // 提交验证 - 移除 loadingProgress 检查
    const canSubmit = gender !== null && topic.trim().length > 0;

    const handleSubmit = () => {
        if (canSubmit && gender) {
            onSubmit({ gender, age, topic });
        }
    };

    const isDark = theme.id === 'modern';

    return (
        <main className={`flex-1 flex items-start sm:items-center justify-center px-4 py-1.5 sm:p-6 overflow-y-auto no-scrollbar ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="w-full max-w-md space-y-3 sm:space-y-8">
                {/* 标题 */}
                <div className="text-center space-y-0.5 sm:space-y-2">
                    <h2 className={`text-xl sm:text-3xl leading-tight font-light tracking-normal sm:tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {isReassessment ? '重新评估' : '开始你的决策之旅'}
                    </h2>
                    <p className={`text-[11px] sm:text-sm leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isReassessment ? '请输入新的决策主题' : '请先告诉我们关于你'}
                    </p>
                </div>

                {/* 性别选择 */}
                <div>
                    <label className={`block text-xs sm:text-sm font-medium mb-1 sm:mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        性别
                    </label>
                    <div className="flex gap-3 sm:gap-4 justify-center">
                        {/* 男性 */}
                        <div
                            onClick={() => setGender('male')}
                            className={`cursor-pointer transition-all duration-300 rounded-lg p-1.5 sm:p-3 ${gender === 'male'
                                ? isDark
                                    ? 'border-4 border-indigo-400 bg-indigo-500/30 shadow-lg shadow-indigo-500/50'
                                    : 'border-4 border-blue-600 bg-blue-100 shadow-lg shadow-blue-500/30'
                                : isDark
                                    ? 'border-2 border-slate-700 hover:border-slate-600 bg-slate-800/50'
                                    : 'border-2 border-slate-300 hover:border-slate-400 bg-white'
                                }`}
                        >
                            <AvatarImage
                                gender="male"
                                age={gender === 'male' ? age : 35}
                                className="w-16 h-20 sm:w-24 sm:h-32 object-cover rounded-lg"
                            />
                            <p className={`text-center mt-0.5 sm:mt-2 text-xs sm:text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                男性
                            </p>
                        </div>

                        {/* 女性 */}
                        <div
                            onClick={() => setGender('female')}
                            className={`cursor-pointer transition-all duration-300 rounded-lg p-1.5 sm:p-3 ${gender === 'female'
                                ? isDark
                                    ? 'border-4 border-pink-400 bg-pink-500/30 shadow-lg shadow-pink-500/50'
                                    : 'border-4 border-pink-600 bg-pink-100 shadow-lg shadow-pink-500/30'
                                : isDark
                                    ? 'border-2 border-slate-700 hover:border-slate-600 bg-slate-800/50'
                                    : 'border-2 border-slate-300 hover:border-slate-400 bg-white'
                                }`}
                        >
                            <AvatarImage
                                gender="female"
                                age={gender === 'female' ? age : 35}
                                className="w-16 h-20 sm:w-24 sm:h-32 object-cover rounded-lg"
                            />
                            <p className={`text-center mt-0.5 sm:mt-2 text-xs sm:text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                女性
                            </p>
                        </div>
                    </div>
                </div>

                {/* 年龄滑块 */}
                <div>
                    <label className={`block text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        年龄: <span className="text-base sm:text-xl font-bold">{age}</span>岁
                    </label>
                    <div className="relative">
                        <input
                            type="range"
                            min="5"
                            max="80"
                            value={age}
                            onChange={(e) => setAge(Number(e.target.value))}
                            className="w-full h-1.5 sm:h-2 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: isDark
                                    ? `linear-gradient(to right, #6366f1 0%, #6366f1 ${((age - 5) / 75) * 100}%, #334155 ${((age - 5) / 75) * 100}%, #334155 100%)`
                                    : `linear-gradient(to right, #1e293b 0%, #1e293b ${((age - 5) / 75) * 100}%, #e2e8f0 ${((age - 5) / 75) * 100}%, #e2e8f0 100%)`
                            }}
                        />
                        <div className={`hidden sm:flex justify-between text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            <span>5岁</span>
                            <span>80岁</span>
                        </div>
                    </div>
                </div>

                {/* 决策主题 */}
                <div>
                    <label className={`block text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        决策主题
                    </label>
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={topic}
                            onChange={(e) => handleTopicChange(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setSuggestions([]); }}
                            placeholder="输入关键词,如: 财、情、房..."
                            className={`w-full px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg border-2 transition-colors text-sm ${isDark
                                ? 'bg-slate-800 border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500'
                                : 'bg-white border-slate-200 focus:border-slate-800 text-slate-900 placeholder-slate-400'
                                } outline-none`}
                        />
                        {suggestions.length > 0 && (
                            <div ref={suggestionRef} className={`absolute top-full left-0 right-0 mt-2 rounded-lg shadow-xl border overflow-hidden z-10 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                                }`}>
                                <div className="flex justify-end px-2 py-1">
                                    <button
                                        onClick={() => setSuggestions([])}
                                        className="text-sm opacity-60 hover:opacity-90"
                                        aria-label="关闭建议"
                                    >
                                        ✕
                                    </button>
                                </div>
                                {suggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            setTopic(s);
                                            setSuggestions([]);
                                        }}
                                        className={`px-4 py-2.5 cursor-pointer transition-colors text-sm ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <span className="mr-2">💡</span>
                                        {s}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>



                {/* 提交按钮 */}
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`w-full px-6 py-2 sm:py-3 rounded-lg font-medium transition-all ${canSubmit
                        ? isDark
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/50'
                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    开始选择卡牌
                </button>
            </div>
        </main>
    );
};
