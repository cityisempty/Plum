import { Router } from "express";
import { config } from "../lib/config.js";
import { getDb } from "../db/client.js";
import { AppError, spendForDecision } from "../lib/points.js";
import { buildDecisionPrompt, createDecisionUpstream, pipeDecisionSse, type DecisionRequest } from "../lib/decision.js";
import { requireUser, type AuthedRequest } from "../middleware/auth.js";

export const decisionRouter = Router();

function writeLocalMock(res: import("express").Response) {
  const text = "### 本地测试解读\n\n这是本地模拟结果。请求未发送到外部决策投射服务，但已验证统一点数扣减与流式展示。";
  res.set({ "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
  res.write(`data: ${JSON.stringify({ type: "meta", model: "local", modelDetail: "mock", promptVersion: "current" })}\n\n`);
  for (const chunk of text.match(/.{1,12}/g) ?? []) res.write(`data: ${JSON.stringify({ type: "content", text: chunk })}\n\n`);
  res.end('data: {"type":"done"}\n\n');
}

decisionRouter.post("/interpret", requireUser, async (req: AuthedRequest, res, next) => {
  const body = req.body as DecisionRequest;
  if (!Array.isArray(body?.cardContext) || body.cardContext.length === 0) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "请先完成卡牌选择" });
    return;
  }
  try {
    let upstream: Awaited<ReturnType<typeof createDecisionUpstream>> | null = null;
    if (!config.decisionLocalMock) upstream = await createDecisionUpstream(body);
    const { pointsRemaining } = spendForDecision(getDb(), req.userId!);
    res.set("X-Points-Remaining", String(pointsRemaining));
    if (!upstream) {
      writeLocalMock(res);
      return;
    }
    await pipeDecisionSse(upstream, res, body.promptVersion);
  } catch (error) {
    // 上游开始流式输出后，响应头已经发出，不能再切换成 JSON 错误响应。
    // 直接结束连接，避免 Express 抛出二次 headers-sent 异常。
    if (res.headersSent) {
      if (!res.writableEnded) res.end();
      return;
    }
    if (error instanceof AppError) {
      res.status(error.status).json({ error: error.code, message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(502).json({ error: "DECISION_UNAVAILABLE", message: error.message });
      return;
    }
    next(error);
  }
});

// 仅供管理后台做连通性说明，不返回密钥。
export function decisionPromptPreview() {
  return buildDecisionPrompt({ cardContext: [] });
}
