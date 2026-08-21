/**
 * 头像图片按需加载服务
 * 提供默认头像预加载和动态加载功能
 */

export interface AvatarLoadProgress {
    loaded: number;
    total: number;
    percentage: number;
    isComplete: boolean;
}

type ProgressCallback = (progress: AvatarLoadProgress) => void;

class AvatarPreloader {
    private loadedAvatars = new Set<string>();
    private progressCallbacks: ProgressCallback[] = [];
    private totalAvatars = 0;
    private isPreloading = false;
    private currentPreloadPromise: Promise<void> | null = null;

    /**
     * 预加载默认头像(男女各35岁)
     */
    async preloadDefaultAvatars(): Promise<void> {
        const defaultAvatars = [
            '/decision/avatars/male/35.webp',
            '/decision/avatars/female/35.webp'
        ];

        this.totalAvatars = defaultAvatars.length;
        this.isPreloading = true;

        this.currentPreloadPromise = (async () => {
            try {
                await Promise.all(defaultAvatars.map(url => this.loadAvatar(url)));
            } catch (error) {
                console.error('默认头像加载失败:', error);
            } finally {
                this.isPreloading = false;
                this.currentPreloadPromise = null;
            }
        })();

        return this.currentPreloadPromise;
    }

    /**
     * 按需加载指定性别和年龄的头像
     */
    async loadAvatarByAge(gender: 'male' | 'female', age: number): Promise<void> {
        const ageGroup = this.getAgeGroup(age);
        const url = `/decision/avatars/${gender}/${ageGroup}.webp`;

        // 如果已加载,直接返回
        if (this.loadedAvatars.has(url)) {
            return Promise.resolve();
        }

        return this.loadAvatar(url);
    }

    /**
     * 加载单张头像
     */
    private loadAvatar(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // 如果已经加载过,直接返回
            if (this.loadedAvatars.has(url)) {
                resolve();
                return;
            }

            const img = new Image();

            img.onload = () => {
                this.loadedAvatars.add(url);
                this.notifyProgress();
                resolve();
            };

            img.onerror = () => {
                console.warn(`头像加载失败: ${url}`);
                // 即使失败也标记为已处理,避免阻塞
                this.loadedAvatars.add(url);
                this.notifyProgress();
                resolve(); // 不 reject,继续加载其他图片
            };

            img.src = url;
        });
    }

    /**
     * 根据年龄获取年龄段
     */
    private getAgeGroup(age: number): number {
        if (age < 5) return 5;
        if (age >= 60) return 60;
        return Math.floor(age / 5) * 5;
    }

    /**
     * 通知所有订阅者进度更新
     */
    private notifyProgress(): void {
        const progress = this.getProgress();
        this.progressCallbacks.forEach(callback => callback(progress));
    }

    /**
     * 获取当前加载进度
     */
    getProgress(): AvatarLoadProgress {
        const loaded = this.loadedAvatars.size;
        const total = this.totalAvatars || 1;
        const isComplete = loaded >= total && total > 0;
        const percentage = isComplete ? 100 : Math.ceil((loaded / total) * 100);

        return { loaded, total, percentage, isComplete };
    }

    /**
     * 订阅进度更新
     */
    onProgress(callback: ProgressCallback): () => void {
        this.progressCallbacks.push(callback);

        // 返回取消订阅函数
        return () => {
            const index = this.progressCallbacks.indexOf(callback);
            if (index > -1) {
                this.progressCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * 检查头像是否已加载
     */
    isAvatarLoaded(gender: 'male' | 'female', age: number): boolean {
        const ageGroup = this.getAgeGroup(age);
        const url = `/decision/avatars/${gender}/${ageGroup}.webp`;
        return this.loadedAvatars.has(url);
    }

    /**
     * 重置预加载器
     */
    reset(): void {
        this.loadedAvatars.clear();
        this.totalAvatars = 0;
        this.progressCallbacks = [];
        this.isPreloading = false;
    }
}

// 导出单例
export const avatarPreloader = new AvatarPreloader();
