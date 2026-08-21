/**
 * Prompt 版本注册表
 * 统一管理所有可用的 prompt 版本
 */
import { PromptTemplate, CardAnalysisVariables } from "../types";
import { cardAnalysisPrompt } from "./cardAnalysisPrompt";
import { chatgptPrompt } from "./cardAnalysisPrompt.chatgpt";
import { claudePrompt } from "./cardAnalysisPrompt.claude";
import { geminiPrompt } from "./cardAnalysisPrompt.gemini";
import { grokPrompt } from "./cardAnalysisPrompt.grok";
import { kimiPrompt } from "./cardAnalysisPrompt.kimi";
import { qwenPrompt } from "./cardAnalysisPrompt.qwen";

/** 所有可用的 prompt 版本 */
export const promptVersions: Record<string, PromptTemplate<CardAnalysisVariables>> = {
    'current': cardAnalysisPrompt,
    'chatgpt': chatgptPrompt,
    'claude': claudePrompt,
    'gemini': geminiPrompt,
    'grok': grokPrompt,
    'kimi': kimiPrompt,
    'qwen': qwenPrompt,
};

/** 默认版本（正式使用） */
export const DEFAULT_PROMPT_VERSION = 'current';

/** 获取所有版本 ID 列表 */
export function getPromptVersionIds(): string[] {
    return Object.keys(promptVersions);
}

/** 获取版本信息摘要 */
export function getPromptVersionSummaries(): Array<{ id: string; name: string; version: string; description?: string }> {
    return Object.entries(promptVersions).map(([id, template]) => ({
        id,
        name: template.name,
        version: template.version,
        description: template.description,
    }));
}
