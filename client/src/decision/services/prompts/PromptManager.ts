import { UserInfo } from "../../components/UserInfoDialog";
import { PlacedCard, CardData } from "../../types";
import { cardAnalysisPrompt } from "./templates/cardAnalysisPrompt";
import { PromptTemplate, CardAnalysisVariables } from "./types";
import { promptVersions, DEFAULT_PROMPT_VERSION, getPromptVersionIds, getPromptVersionSummaries } from "./templates/registry";

/**
 * Prompt 管理器
 * 统一管理所有 AI Prompt 模板，支持多版本切换
 */
export class PromptManager {
    private templates: Map<string, PromptTemplate<any>> = new Map();

    constructor() {
        // 注册所有版本模板
        Object.values(promptVersions).forEach(template => {
            this.registerTemplate(template);
        });
    }

    /**
     * 注册新的 prompt 模板
     */
    registerTemplate<T>(template: PromptTemplate<T>): void {
        this.templates.set(template.name, template);
        console.log(`[PromptManager] 已注册模板: ${template.name} (v${template.version})`);
    }

    /**
     * 构建卡牌分析 Prompt
     * @param cardContext 卡牌上下文数据
     * @param userInfo 用户信息(可选)
     * @param promptVersion 指定 prompt 版本(可选，默认使用 current)
     * @returns 完整的 prompt 字符串
     */
    buildCardAnalysisPrompt(
        cardContext: any[],
        userInfo?: UserInfo,
        promptVersion?: string
    ): string {
        // 构建用户背景信息
        const userContext = userInfo ? this.buildUserContext(userInfo) : '';

        // 规范化卡牌上下文数据，将其转化为半结构化文本
        const formattedContext = cardContext.map((c, i) => {
            const roleIdx = i + 1;
            const roleLabel = roleIdx === 1 ? '核心驱动' : roleIdx === 2 ? '认知调节' : '平衡整合';

            // 提取针对性的分析逻辑（正位用正向逻辑，逆位用负向逻辑）
            const isUpright = c.orientation?.includes('正位');
            const targetLogic = isUpright
                ? c.gridPosition?.interpretationLogic?.positive
                : c.gridPosition?.interpretationLogic?.negative;

            return `【摆放序列 #${roleIdx}】(${roleLabel})
- 选用品项：${c.cardName} (${c.element || '未知属性'}, ${c.orientation})
- 摆放位置：${c.gridPosition?.name || '未知位置'} (${c.gridPosition?.timeSpace || '-'} / ${c.gridPosition?.focus || '-'})
- 品项含义：${c.cardMeaning || '暂无数据'}
- 核心分析逻辑：${targetLogic || '按常规象征意义分析'}`;
        }).join('\n\n');

        // 构建变量
        const variables: CardAnalysisVariables = {
            userContext,
            cardContext: formattedContext
        };

        // 根据版本选择模板
        const versionId = promptVersion || DEFAULT_PROMPT_VERSION;
        const versionTemplate = promptVersions[versionId];

        if (versionTemplate) {
            return versionTemplate.build(variables);
        }

        // 兜底：使用默认模板
        const template = this.templates.get('card-analysis');
        if (!template) {
            throw new Error('卡牌分析模板未找到');
        }

        return template.build(variables);
    }

    /**
     * 构建用户背景信息部分
     */
    private buildUserContext(userInfo: UserInfo): string {
        return `
## 用户背景信息

- **性别**: ${userInfo.gender === 'male' ? '男性' : '女性'}
- **年龄**: ${userInfo.age}岁
- **决策主题**: ${userInfo.topic}

请特别关注用户的年龄段特征和性别视角,针对"${userInfo.topic}"这一主题,提供更贴合用户实际情况的分析和建议。

`;
    }

    /**
     * 获取所有可用的 prompt 版本列表
     */
    getAvailableVersions(): Array<{ id: string; name: string; version: string; description?: string }> {
        return getPromptVersionSummaries();
    }

    /**
     * 获取所有版本 ID
     */
    getVersionIds(): string[] {
        return getPromptVersionIds();
    }

    /**
     * 获取模板版本信息
     */
    getTemplateVersion(name: string): string | undefined {
        const template = this.templates.get(name);
        return template?.version;
    }

    /**
     * 获取所有已注册的模板
     */
    getRegisteredTemplates(): string[] {
        return Array.from(this.templates.keys());
    }

    /**
     * 获取模板信息
     */
    getTemplateInfo(name: string): { name: string; version: string; description?: string } | undefined {
        const template = this.templates.get(name);
        if (!template) return undefined;

        return {
            name: template.name,
            version: template.version,
            description: template.description
        };
    }
}
