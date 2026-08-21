/** Plum 服务端决策接口客户端。浏览器不再持有或发送模型密钥。 */

export interface DecisionInterpretRequest {
    cardContext: Array<{
        cardName: string;
        element: string;
        orientation: string;
        cardMeaning: string;
        gridPosition: {
            index: number;
            name: string;
            timeSpace?: string;
            focus?: string;
            source?: string;
            interpretationLogic?: {
                positive?: string;
                negative?: string;
            };
        };
    }>;
    userInfo?: {
        gender: string;
        age: number;
        topic: string;
    };
    model?: 'gemini' | 'openai' | 'custom';
    promptVersion?: string;  // 指定 prompt 版本（对比调试用）
}

export interface InterpretResult {
    interpretation: string;
    model?: string;
    modelDetail?: string;
    promptVersion?: string;
    pointsRemaining: number;
}

/**
 * 通过 Plum 服务端调用 AI 解读接口。服务端会在建立模型流后扣除统一点数。
 * @param request 解读请求数据(包含完整的卡牌上下文)
 * @returns AI 解读结果
 */
export async function callDecisionInterpret(
    request: DecisionInterpretRequest,
    onProgress?: (chunk: string, meta?: any) => void
): Promise<InterpretResult> {
    const startTime = Date.now();
    try {
        console.log(`[Timer] 0ms - 🚀 发起 POST /api/decision/interpret 请求`);
        const response = await fetch('/api/decision/interpret', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
            },
            body: JSON.stringify(request),
            credentials: 'include',
        });
        console.log(`[Timer] ${Date.now() - startTime}ms - 📥 收到服务端模型响应 Header，状态: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.message || errorData.error || `API 请求失败: ${response.status}`) as Error & { status?: number };
            error.status = response.status;
            throw error;
        }

        const pointsRemaining = Number(response.headers.get('X-Points-Remaining'));
        if (!Number.isInteger(pointsRemaining) || pointsRemaining < 0) {
            throw new Error('未收到最新点数，请刷新后重试');
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('ReadableStream not supported');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        let meta = { model: '', modelDetail: '', promptVersion: '' };
        let isFirstByte = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmedLine = line.trim();
                // 兼容不同平台的模型返回 SSE 前缀
                if (!trimmedLine || (!trimmedLine.startsWith('data:') && !trimmedLine.startsWith('data: '))) {
                    continue; // 有些大模型返回空字符串的错误数据，统统忽略
                }
                const prefixLen = trimmedLine.startsWith('data: ') ? 6 : 5;
                const dataStr = trimmedLine.slice(prefixLen);
                if (dataStr === '[DONE]') continue;

                try {
                    const data = JSON.parse(dataStr);
                    if (data.type === 'meta') {
                        meta = {
                            model: data.model,
                            modelDetail: data.modelDetail,
                            promptVersion: data.promptVersion
                        };
                        console.log(`[Timer] ${Date.now() - startTime}ms - ✅ 收到模型元信息 | 通道: ${meta.model}`);
                        if (onProgress) onProgress('', meta);
                    } else if (data.type === 'content') {
                        if (isFirstByte) {
                            console.log(`[Timer] ${Date.now() - startTime}ms - ⚡️ 收到首个真实文字 chunk! 开始流式输出`);
                            isFirstByte = false;
                        }
                        fullText += data.text;
                        if (onProgress) onProgress(data.text, meta);
                    } else if (data.type === 'done') {
                        console.log(`[Timer] ${Date.now() - startTime}ms - 🏁 AI 输出流结束`);
                    } else if (data.type === 'error') {
                        throw new Error(data.error);
                    }
                } catch (e) {
                    if (e instanceof Error && e.message === dataStr) {
                        throw e;
                    }
                }
            }
        }

        return {
            interpretation: fullText,
            model: meta.model,
            modelDetail: meta.modelDetail,
            promptVersion: meta.promptVersion,
            pointsRemaining,
        };
    } catch (error) {
        console.error('[DecisionAPI] AI 解读失败:', error);

        if (error instanceof Error) {
            throw error;
        }

        throw new Error('调用决策模型失败，请检查网络连接');
    }
}
