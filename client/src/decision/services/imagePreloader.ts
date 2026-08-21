/**
 * 图片预加载服务
 * 提供优先级队列和进度追踪功能
 */

export interface PreloadProgress {
    loaded: number;
    total: number;
    percentage: number;
    isComplete: boolean;
}

type ProgressCallback = (progress: PreloadProgress) => void;

class ImagePreloader {
    private loadedImages = new Set<string>();
    private totalImages = 0;
    private progressCallbacks: ProgressCallback[] = [];
    private isPreloading = false;
    private currentPreloadPromise: Promise<void> | null = null;

    /**
     * 预加载图片列表
     * @param imageUrls 图片 URL 数组
     * @param priorityCount 优先加载的图片数量(前N张)
     * @param batchSize 每批并发加载的图片数量
     */
    async preloadImages(
        imageUrls: string[],
        priorityCount: number = 20,
        batchSize: number = 5
    ): Promise<void> {
        // 如果已经在预加载,返回当前的 Promise
        if (this.isPreloading && this.currentPreloadPromise) {
            console.log('预加载已在进行中,返回现有 Promise');
            return this.currentPreloadPromise;
        }

        this.isPreloading = true;
        this.totalImages = imageUrls.length;
        this.loadedImages.clear();

        // 分离高优先级和低优先级图片
        const priorityImages = imageUrls.slice(0, priorityCount);
        const normalImages = imageUrls.slice(priorityCount);

        this.currentPreloadPromise = (async () => {
            try {
                // 先加载高优先级图片
                await this.loadBatch(priorityImages, batchSize);

                // 再加载低优先级图片
                await this.loadBatch(normalImages, batchSize);
            } catch (error) {
                console.error('图片预加载失败:', error);
            } finally {
                this.isPreloading = false;
                this.currentPreloadPromise = null;
            }
        })();

        return this.currentPreloadPromise;
    }

    /**
     * 分批加载图片
     */
    private async loadBatch(imageUrls: string[], batchSize: number): Promise<void> {
        for (let i = 0; i < imageUrls.length; i += batchSize) {
            const batch = imageUrls.slice(i, i + batchSize);
            await Promise.all(batch.map(url => this.loadImage(url)));
        }
    }

    /**
     * 加载单张图片
     */
    private loadImage(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // 如果已经加载过,直接返回
            if (this.loadedImages.has(url)) {
                resolve();
                return;
            }

            const img = new Image();

            img.onload = () => {
                this.loadedImages.add(url);
                this.notifyProgress();
                resolve();
            };

            img.onerror = () => {
                console.warn(`图片加载失败: ${url}`);
                // 即使失败也标记为已处理,避免阻塞
                this.loadedImages.add(url);
                this.notifyProgress();
                resolve(); // 不 reject,继续加载其他图片
            };

            img.src = url;
        });
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
    getProgress(): PreloadProgress {
        const loaded = this.loadedImages.size;
        const total = this.totalImages || 1; // 避免除以0
        const isComplete = loaded >= total && total > 0;
        // 如果已完成,强制显示 100%,否则计算百分比
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
     * 检查图片是否已加载
     */
    isImageLoaded(url: string): boolean {
        return this.loadedImages.has(url);
    }

    /**
     * 重置预加载器
     */
    reset(): void {
        this.loadedImages.clear();
        this.totalImages = 0;
        this.progressCallbacks = [];
        this.isPreloading = false;
    }
}

// 导出单例
export const imagePreloader = new ImagePreloader();
