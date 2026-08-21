import React, { useEffect } from 'react';
import { avatarPreloader } from '../services/avatarPreloader';

interface AvatarImageProps {
    gender: 'male' | 'female';
    age: number;
    className?: string;
}

/**
 * 根据年龄获取对应的图片文件名
 * 规则:
 * - 15-19岁 → 15.png
 * - 20-24岁 → 20.png
 * - 25-29岁 → 25.png
 * - ...
 * - 55-59岁 → 55.png
 * - 60岁及以上 → 60.png (固定)
 */
function getAgeGroup(age: number): number {
    if (age < 5) return 5;
    if (age >= 60) return 60;

    // 5-59岁,按5岁一档: 5, 10, 15, ..., 55
    return Math.floor(age / 5) * 5;
}

/**
 * 头像图片组件
 * 根据性别和年龄显示对应的 PNG 图片
 * 支持懒加载和动态加载
 */
export const AvatarImage: React.FC<AvatarImageProps> = ({ gender, age, className = '' }) => {
    const ageGroup = getAgeGroup(age);
    const imagePath = `/decision/avatars/${gender}/${ageGroup}.webp`;

    // 动态加载头像
    useEffect(() => {
        avatarPreloader.loadAvatarByAge(gender, age);
    }, [gender, age]);

    return (
        <img
            src={imagePath}
            alt={`${gender === 'male' ? '男性' : '女性'} ${age}岁`}
            className={className}
            loading="lazy"
            style={{
                width: '96px',
                height: '128px',
                objectFit: 'cover'
            }}
            onError={(e) => {
                // 如果图片加载失败,显示占位符
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                console.warn(`头像图片加载失败: ${imagePath}`);
            }}
        />
    );
};
