import { config } from "./config.js";

export type DecisionCard = {
  cardName?: string;
  element?: string;
  orientation?: string;
  cardMeaning?: string;
  gridPosition?: {
    name?: string;
    timeSpace?: string;
    focus?: string;
    interpretationLogic?: { positive?: string; negative?: string };
  };
};

export type DecisionRequest = {
  cardContext: DecisionCard[];
  userInfo?: { gender?: string; age?: number; topic?: string };
  model?: string;
  promptVersion?: string;
};

export type DecisionUpstream = { response: Response; provider: string; model: string };

function clean(value: unknown, max = 2000) {
  return String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, max);
}

export function buildDecisionPrompt(input: DecisionRequest) {
  const user = input.userInfo
    ? `\n## 用户背景\n- 性别：${clean(input.userInfo.gender, 30)}\n- 年龄：${clean(input.userInfo.age, 8)}岁\n- 决策主题：${clean(input.userInfo.topic, 300)}\n`
    : "";
  const cards = input.cardContext.map((card, index) => {
    const grid = card.gridPosition ?? {};
    const logic = card.orientation?.includes("正位") ? grid.interpretationLogic?.positive : grid.interpretationLogic?.negative;
    const role = index === 0 ? "核心驱动" : index === 1 ? "认知调节" : "平衡整合";
    return `【摆放序列 #${index + 1}】（${role}）
- 选用品项：${clean(card.cardName, 160)}（${clean(card.element, 50)}，${clean(card.orientation, 50)}）
- 摆放位置：${clean(grid.name, 100)}（${clean(grid.timeSpace, 80)} / ${clean(grid.focus, 100)}）
- 品项含义：${clean(card.cardMeaning)}
- 核心分析逻辑：${clean(logic || "按常规象征意义分析")}`;
  }).join("\n\n");
  return `# 卡牌决策模式分析系统\n\n你是一位懂人心的决策解读师。请通过内心情节（无意识驱动）、现实情境（当前约束）、思维模式（长期决策习惯），帮助用户看清自己为什么这么选、为什么纠结、问题真正在哪里。语言像朋友聊天，具体、温和、直抵要害，不要声称这是科学诊断。\n\n分析权重：序列 #1 占 70%，#2 占 20%，#3 占 10%。必须优先使用“核心分析逻辑”，再结合品项含义、摆放位置、元素属性和正逆位。\n${user}\n## 卡牌信息\n${cards}\n\n## 输出要求\n请输出一份结构清晰的中文报告，包含：\n1. 一句话洞察\n2. 三张牌分别揭示的心理动力（按 70/20/10 权重展开）\n3. 当前真正的矛盾与盲点\n4. 可执行的决策建议（给出 3 个具体行动）\n5. 温和但明确的收束。\n不要复述输入，不要输出内部推理过程，使用 Markdown。`;
}

function openAiUrl(base: string) {
  return `${base.replace(/\/$/, "")}/chat/completions`;
}

async function openAi(input: DecisionRequest, provider: "openai" | "custom", apiKey: string, baseUrl: string, model: string) {
  const response = await fetch(openAiUrl(baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: buildDecisionPrompt(input) }], temperature: 0.9, max_tokens: 8192, stream: true }),
    signal: AbortSignal.timeout(120_000),
  });
  return { response, provider, model };
}

export async function createDecisionUpstream(input: DecisionRequest): Promise<DecisionUpstream> {
  const requested = input.model && ["gemini", "openai", "custom"].includes(input.model) ? input.model : "";
  const priority = (requested ? [requested] : config.modelPriority.split(",")).map((x) => x.trim()).filter(Boolean);
  let lastError = "没有可用的模型配置";
  for (const provider of priority) {
    try {
      if (provider === "gemini" && config.geminiApiKey) {
        const model = config.geminiModel;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${config.geminiApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          body: JSON.stringify({ contents: [{ parts: [{ text: buildDecisionPrompt(input) }] }], generationConfig: { temperature: 0.9, topK: 40, topP: 0.95, maxOutputTokens: 8192 } }),
          signal: AbortSignal.timeout(120_000),
        });
        if (response.ok && response.body) return { response, provider, model };
        lastError = `Gemini 返回 ${response.status}`;
      } else if (provider === "openai" && config.openaiApiKey) {
        const result = await openAi(input, "openai", config.openaiApiKey, config.openaiBaseUrl, config.openaiModel);
        if (result.response.ok && result.response.body) return result;
        lastError = `OpenAI 返回 ${result.response.status}`;
      } else if (provider === "custom" && config.customApiKey && config.customBaseUrl) {
        const result = await openAi(input, "custom", config.customApiKey, config.customBaseUrl, config.customModel);
        if (result.response.ok && result.response.body) return result;
        lastError = `自定义模型返回 ${result.response.status}`;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "模型请求失败";
    }
  }
  throw new Error(lastError);
}

export function modelStatus() {
  return {
    priority: config.modelPriority.split(",").map((item) => item.trim()).filter(Boolean),
    localMock: config.decisionLocalMock,
    models: [
      { id: "gemini", name: config.geminiModel, configured: Boolean(config.geminiApiKey) },
      { id: "openai", name: config.openaiModel, configured: Boolean(config.openaiApiKey) },
      { id: "custom", name: config.customModel, configured: Boolean(config.customApiKey && config.customBaseUrl) },
    ],
  };
}

export async function pipeDecisionSse(upstream: DecisionUpstream, res: import("express").Response, promptVersion?: string) {
  res.set({ "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
  res.write(`data: ${JSON.stringify({ type: "meta", model: upstream.provider, modelDetail: upstream.model, promptVersion: promptVersion || "current" })}\n\n`);
  const reader = upstream.response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || parsed.choices?.[0]?.delta?.content || "";
          if (text) res.write(`data: ${JSON.stringify({ type: "content", text })}\n\n`);
        } catch {
          // 上游偶发的非 JSON SSE 行不影响后续内容。
        }
      }
    }
  } finally {
    reader.releaseLock();
    res.end('data: {"type":"done"}\n\n');
  }
}
