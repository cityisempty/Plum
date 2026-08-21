import React from 'react';

interface AvatarSVGProps {
    gender: 'male' | 'female';
    ageGroup: number; // 20, 30, 40, 50, 60, 70
    className?: string;
}

export const AvatarSVG: React.FC<AvatarSVGProps> = ({ gender, ageGroup, className = '' }) => {
    const isMale = gender === 'male';

    // 根据年龄段调整颜色
    const getSkinTone = () => {
        if (ageGroup <= 30) return '#FFD4A3';
        if (ageGroup <= 50) return '#E8B896';
        return '#D4A88A';
    };

    const getHairColor = () => {
        if (ageGroup <= 30) return '#2C1810';
        if (ageGroup <= 40) return '#3D2817';
        if (ageGroup <= 50) return '#4A3728';
        if (ageGroup <= 60) return '#6B5D54';
        return '#9E9E9E';
    };

    const skinTone = getSkinTone();
    const hairColor = getHairColor();

    if (isMale) {
        return (
            <svg viewBox="0 0 80 100" className={className} xmlns="http://www.w3.org/2000/svg">
                {/* 头部 */}
                <ellipse cx="40" cy="35" rx="18" ry="22" fill={skinTone} />

                {/* 发型 - 根据年龄变化 */}
                {ageGroup <= 30 && (
                    // 年轻 - 浓密短发
                    <>
                        <path d="M 22 25 Q 22 15, 40 15 Q 58 15, 58 25" fill={hairColor} />
                        <ellipse cx="40" cy="18" rx="20" ry="12" fill={hairColor} />
                    </>
                )}
                {ageGroup > 30 && ageGroup <= 50 && (
                    // 中年 - 略薄短发
                    <>
                        <path d="M 24 26 Q 24 18, 40 18 Q 56 18, 56 26" fill={hairColor} />
                        <ellipse cx="40" cy="20" rx="18" ry="10" fill={hairColor} />
                    </>
                )}
                {ageGroup > 50 && (
                    // 老年 - 稀疏白发
                    <>
                        <path d="M 26 28 Q 28 22, 40 22 Q 52 22, 54 28" fill={hairColor} opacity="0.7" />
                        <line x1="30" y1="22" x2="32" y2="28" stroke={hairColor} strokeWidth="1" />
                        <line x1="40" y1="20" x2="40" y2="26" stroke={hairColor} strokeWidth="1" />
                        <line x1="50" y1="22" x2="48" y2="28" stroke={hairColor} strokeWidth="1" />
                    </>
                )}

                {/* 眉毛 */}
                <path d="M 28 32 Q 32 30, 36 32" stroke="#2C1810" strokeWidth="1.5" fill="none" />
                <path d="M 44 32 Q 48 30, 52 32" stroke="#2C1810" strokeWidth="1.5" fill="none" />

                {/* 眼睛 */}
                <circle cx="32" cy="36" r="2" fill="#2C1810" />
                <circle cx="48" cy="36" r="2" fill="#2C1810" />

                {/* 鼻子 */}
                <line x1="40" y1="38" x2="40" y2="44" stroke="#D4A88A" strokeWidth="1.5" />

                {/* 嘴巴 - 根据年龄调整 */}
                {ageGroup <= 40 ? (
                    <path d="M 34 48 Q 40 50, 46 48" stroke="#8B4513" strokeWidth="1.5" fill="none" />
                ) : (
                    <path d="M 34 48 Q 40 49, 46 48" stroke="#8B4513" strokeWidth="1.5" fill="none" />
                )}

                {/* 皱纹 - 年龄越大越多 */}
                {ageGroup >= 50 && (
                    <>
                        <path d="M 26 40 Q 28 42, 26 44" stroke="#C4957A" strokeWidth="0.5" fill="none" opacity="0.5" />
                        <path d="M 54 40 Q 52 42, 54 44" stroke="#C4957A" strokeWidth="0.5" fill="none" opacity="0.5" />
                    </>
                )}
                {ageGroup >= 60 && (
                    <>
                        <path d="M 30 50 Q 32 51, 30 52" stroke="#C4957A" strokeWidth="0.5" fill="none" opacity="0.5" />
                        <path d="M 50 50 Q 48 51, 50 52" stroke="#C4957A" strokeWidth="0.5" fill="none" opacity="0.5" />
                    </>
                )}

                {/* 身体 */}
                <rect x="28" y="55" width="24" height="35" rx="3" fill="#4A90E2" />

                {/* 领子 */}
                <path d="M 32 55 L 32 60 L 40 58 L 48 60 L 48 55" fill="#2C5AA0" />
            </svg>
        );
    } else {
        // 女性
        return (
            <svg viewBox="0 0 80 100" className={className} xmlns="http://www.w3.org/2000/svg">
                {/* 头部 */}
                <ellipse cx="40" cy="35" rx="17" ry="21" fill={skinTone} />

                {/* 发型 - 根据年龄变化 */}
                {ageGroup <= 30 && (
                    // 年轻 - 长发
                    <>
                        <ellipse cx="40" cy="20" rx="22" ry="15" fill={hairColor} />
                        <path d="M 18 30 Q 18 50, 22 70" fill={hairColor} />
                        <path d="M 62 30 Q 62 50, 58 70" fill={hairColor} />
                    </>
                )}
                {ageGroup > 30 && ageGroup <= 50 && (
                    // 中年 - 中长发
                    <>
                        <ellipse cx="40" cy="22" rx="20" ry="14" fill={hairColor} />
                        <path d="M 20 30 Q 20 45, 24 60" fill={hairColor} />
                        <path d="M 60 30 Q 60 45, 56 60" fill={hairColor} />
                    </>
                )}
                {ageGroup > 50 && (
                    // 老年 - 短发
                    <>
                        <ellipse cx="40" cy="24" rx="19" ry="12" fill={hairColor} opacity="0.8" />
                        <path d="M 21 32 Q 21 38, 23 42" fill={hairColor} opacity="0.8" />
                        <path d="M 59 32 Q 59 38, 57 42" fill={hairColor} opacity="0.8" />
                    </>
                )}

                {/* 眉毛 - 更细更弯 */}
                <path d="M 28 31 Q 32 29, 36 31" stroke="#2C1810" strokeWidth="1" fill="none" />
                <path d="M 44 31 Q 48 29, 52 31" stroke="#2C1810" strokeWidth="1" fill="none" />

                {/* 眼睛 - 更大 */}
                <circle cx="32" cy="35" r="2.5" fill="#2C1810" />
                <circle cx="48" cy="35" r="2.5" fill="#2C1810" />
                <circle cx="32.5" cy="34.5" r="0.8" fill="white" />
                <circle cx="48.5" cy="34.5" r="0.8" fill="white" />

                {/* 睫毛 */}
                <path d="M 30 33 L 29 31" stroke="#2C1810" strokeWidth="0.5" />
                <path d="M 34 33 L 35 31" stroke="#2C1810" strokeWidth="0.5" />
                <path d="M 46 33 L 45 31" stroke="#2C1810" strokeWidth="0.5" />
                <path d="M 50 33 L 51 31" stroke="#2C1810" strokeWidth="0.5" />

                {/* 鼻子 */}
                <line x1="40" y1="37" x2="40" y2="42" stroke="#D4A88A" strokeWidth="1" />

                {/* 嘴巴 - 更小更精致 */}
                <path d="M 35 47 Q 40 49, 45 47" stroke="#E57373" strokeWidth="1.5" fill="none" />

                {/* 皱纹 - 年龄越大越多 */}
                {ageGroup >= 50 && (
                    <>
                        <path d="M 27 39 Q 28 41, 27 43" stroke="#C4957A" strokeWidth="0.5" fill="none" opacity="0.4" />
                        <path d="M 53 39 Q 52 41, 53 43" stroke="#C4957A" strokeWidth="0.5" fill="none" opacity="0.4" />
                    </>
                )}
                {ageGroup >= 60 && (
                    <>
                        <path d="M 31 49 Q 32 50, 31 51" stroke="#C4957A" strokeWidth="0.5" fill="none" opacity="0.4" />
                        <path d="M 49 49 Q 48 50, 49 51" stroke="#C4957A" strokeWidth="0.5" fill="none" opacity="0.4" />
                    </>
                )}

                {/* 身体 */}
                <path d="M 30 55 Q 28 70, 30 90 L 50 90 Q 52 70, 50 55 Z" fill="#E91E63" />

                {/* 领口装饰 */}
                <circle cx="40" cy="58" r="2" fill="#F8BBD0" />
            </svg>
        );
    }
};
