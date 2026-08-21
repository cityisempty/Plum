import { Router } from "express";
import { getDb } from "../db/client.js";
import { divine } from "../lib/meihua.js";
import { AppError, spendAndDivine } from "../lib/points.js";
import { requireUser, type AuthedRequest } from "../middleware/auth.js";

export const divinationRouter = Router();

divinationRouter.post("/", requireUser, (req: AuthedRequest, res) => {
  const number = String(req.body?.number ?? "").trim();
  if (!/^\d{6}$/.test(number)) {
    res.status(400).json({ error: "INVALID_NUMBER", message: "请输入六位数字" });
    return;
  }
  try {
    const out = spendAndDivine(getDb(), req.userId!, number);
    res.json({
      id: out.id,
      input: out.input,
      upper: out.upperName,
      lower: out.lowerName,
      upperNature: out.upperNature,
      lowerNature: out.lowerNature,
      hexagramOrder: out.hexagramOrder,
      hexagramName: out.hexagramName,
      movingLine: out.movingLine,
      movingName: out.movingName,
      code: out.codeStr,
      sixYao: out.sixYao,
      sixYaoNames: out.sixYaoNames,
      range: out.range,
      interpretation: out.interpretation,
      pointsRemaining: out.pointsRemaining,
    });
  } catch (e) {
    if (e instanceof AppError) {
      res.status(e.status).json({ error: e.code, message: e.message });
      return;
    }
    if (e instanceof Error && e.message === "INVALID_NUMBER") {
      res.status(400).json({ error: "INVALID_NUMBER", message: "请输入六位数字" });
      return;
    }
    throw e;
  }
});

divinationRouter.get("/", requireUser, (req: AuthedRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const db = getDb();
  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM divinations WHERE user_id = ?`)
    .get(req.userId) as { total: number };
  const items = db
    .prepare(
      `SELECT id, input, hexagram_name, moving_name, code, title, summary, created_at
       FROM divinations WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(req.userId, limit, offset) as Array<{
    id: number;
    input: string;
    hexagram_name: string;
    moving_name: string;
    code: number;
    title: string;
    summary: string;
    created_at: number;
  }>;
  res.json({
    page,
    limit,
    total,
    items: items.map((it) => ({
      id: it.id,
      input: it.input,
      hexagramName: it.hexagram_name,
      movingName: it.moving_name,
      code: String(it.code).padStart(5, "0"),
      title: it.title,
      summary: it.summary,
      createdAt: it.created_at,
    })),
  });
});

divinationRouter.get("/:id", requireUser, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const row = getDb()
    .prepare(`SELECT * FROM divinations WHERE id = ? AND user_id = ?`)
    .get(id, req.userId) as Record<string, unknown> | undefined;
  if (!row) {
    res.status(404).json({ error: "NOT_FOUND", message: "记录不存在" });
    return;
  }
  const interp = JSON.parse(String(row.interpretation_json));
  const replay = divine(String(row.input));
  res.json({
    id: row.id,
    input: row.input,
    upper: replay.upperName,
    lower: replay.lowerName,
    upperNature: replay.upperNature,
    lowerNature: replay.lowerNature,
    hexagramOrder: row.hexagram_order,
    hexagramName: row.hexagram_name,
    movingLine: row.moving_line,
    movingName: row.moving_name,
    code: String(row.code).padStart(5, "0"),
    sixYao: replay.sixYao,
    sixYaoNames: replay.sixYaoNames,
    range: replay.range,
    title: row.title,
    summary: row.summary,
    interpretation: interp,
    createdAt: row.created_at,
  });
});
