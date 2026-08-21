import { UserInfo } from "../../components/UserInfoDialog";

/**
 * Prompt 模板变量 - 卡牌分析
 */
export interface CardAnalysisVariables {
    userContext: string;      // 用户背景信息
    cardContext: string;      // 卡牌上下文(JSON 字符串)
}

/**
 * Prompt 模板接口
 */
export interface PromptTemplate<T> {
    name: string;             // 模板名称
    version: string;          // 版本号
    description?: string;     // 描述
    build(variables: T): string;  // 构建 prompt
}

/**
 * 用户信息构建器参数
 */
export interface UserInfoBuilderParams {
    gender: 'male' | 'female';
    age: number;
    topic: string;
}
