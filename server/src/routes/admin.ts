import crypto from "node:crypto";
import { Router } from "express";
import { getDb } from "../db/client.js";
import { ADMIN_CSRF_COOKIE, clearAdminCookie, issueAdminCsrf, setAdminCookie } from "../lib/http.js";
import { signAdmin } from "../lib/jwt.js";
import { verifyPassword } from "../lib/password.js";
import { AppError, recharge } from "../lib/points.js";
import { requireAdmin, requireAdminCsrf, type AuthedRequest } from "../middleware/auth.js";
import { modelStatus } from "../lib/decision.js";

export const adminRouter = Router();

type Challenge = { question: string; answer: number; expiresAt: number; attempts: number };
const challenges = new Map<string, Challenge>();
const failures = new Map<string, { count: number; lockedUntil: number }>();

function challenge() {
  const a = crypto.randomInt(2, 10);
  const b = crypto.randomInt(2, 10);
  return { question: `${a} + ${b} = ?`, answer: a + b };
}

adminRouter.get("/challenge", (_req, res) => {
  const now = Date.now();
  for (const [id, item] of challenges) {
    if (item.expiresAt <= now) challenges.delete(id);
  }
  const id = crypto.randomUUID();
  const item = challenge();
  challenges.set(id, { ...item, expiresAt: Date.now() + 5 * 60_000, attempts: 0 });
  res.set("Cache-Control", "no-store").json({ id, question: item.question });
});

adminRouter.post("/login", (req, res) => {
  const ip = req.ip || "unknown";
  const lock = failures.get(ip);
  if (lock && lock.lockedUntil > Date.now()) {
    res.status(429).json({ error: "LOGIN_LOCKED", message: "登录失败次数过多，请稍后再试" });
    return;
  }
  const username = String(req.body?.username ?? "").trim();
  const password = String(req.body?.password ?? "");
  const challengeId = String(req.body?.challengeId ?? "");
  const challengeAnswer = Number(req.body?.challengeAnswer);
  const check = challenges.get(challengeId);
  if (check) check.attempts += 1;
  if (!check || check.expiresAt < Date.now() || check.attempts > 3 || check.answer !== challengeAnswer) {
    if (check?.attempts && check.attempts >= 3) challenges.delete(challengeId);
    res.status(401).json({ error: "CHALLENGE_INVALID", message: "安全校验答案不正确或已过期" });
    return;
  }
  challenges.delete(challengeId);
  const row = getDb()
    .prepare(`SELECT id, username, password_hash FROM admins WHERE username = ?`)
    .get(username) as { id: number; username: string; password_hash: string } | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) {
    const next = { count: (lock?.count ?? 0) + 1, lockedUntil: 0 };
    if (next.count >= 5) next.lockedUntil = Date.now() + 15 * 60_000;
    failures.set(ip, next);
    res.status(401).json({ error: "BAD_CREDENTIALS", message: "管理员账号或密码错误" });
    return;
  }
  failures.delete(ip);
  setAdminCookie(res, signAdmin(row.id));
  issueAdminCsrf(res);
  res.set("Cache-Control", "no-store").json({ admin: { id: row.id, username: row.username } });
});

adminRouter.post("/logout", requireAdmin, requireAdminCsrf, (_req, res) => {
  clearAdminCookie(res);
  res.status(204).end();
});

adminRouter.get("/me", requireAdmin, (req: AuthedRequest, res) => {
  const row = getDb()
    .prepare(`SELECT id, username FROM admins WHERE id = ?`)
    .get(req.adminId) as { id: number; username: string } | undefined;
  if (!row) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "管理员不存在" });
    return;
  }
  if (!req.cookies?.[ADMIN_CSRF_COOKIE]) issueAdminCsrf(res);
  res.set("Cache-Control", "no-store").json({ admin: row });
});

adminRouter.get("/overview", requireAdmin, (_req, res) => {
  const db = getDb();
  const users = db.prepare(`SELECT COUNT(*) AS n FROM users`).get() as { n: number };
  const points = db.prepare(`SELECT COALESCE(SUM(points), 0) AS n FROM users`).get() as { n: number };
  const divinations = db.prepare(`SELECT COUNT(*) AS n FROM divinations`).get() as { n: number };
  const decisionSpends = db.prepare(`SELECT COUNT(*) AS n FROM point_transactions WHERE type = 'decision_spend'`).get() as { n: number };
  const plumSpends = db.prepare(`SELECT COUNT(*) AS n FROM point_transactions WHERE type = 'divination_spend'`).get() as { n: number };
  res.json({ users: users.n, points: points.n, divinations: divinations.n, decisionSpends: decisionSpends.n, plumSpends: plumSpends.n, model: modelStatus() });
});

adminRouter.get("/model", requireAdmin, (_req, res) => {
  res.json(modelStatus());
});

adminRouter.get("/users", requireAdmin, (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const q = String(req.query.search ?? "").trim();
  const db = getDb();
  const like = `%${q}%`;
  const where = q ? `WHERE username LIKE ? OR email LIKE ?` : "";
  const params = q ? [like, like] : [];
  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM users ${where}`)
    .get(...params) as { total: number };
  const items = db
    .prepare(
      `SELECT id, email, username, points, created_at, disabled_at, wechat_openid, avatar_url FROM users ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset);
  res.json({ page, limit, total, items });
});

adminRouter.get("/users/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const user = getDb()
    .prepare(`SELECT id, email, username, points, created_at FROM users WHERE id = ?`)
    .get(id);
  if (!user) {
    res.status(404).json({ error: "NOT_FOUND", message: "用户不存在" });
    return;
  }
  const { n } = getDb()
    .prepare(`SELECT COUNT(*) AS n FROM divinations WHERE user_id = ?`)
    .get(id) as { n: number };
  res.json({ user, divinationCount: n });
});

adminRouter.post("/users/:id/recharge", requireAdmin, requireAdminCsrf, (req: AuthedRequest, res) => {
  try {
    const out = recharge(
      getDb(),
      req.adminId!,
      Number(req.params.id),
      Number(req.body?.amount),
      String(req.body?.note ?? ""),
    );
    res.json(out);
  } catch (e) {
    if (e instanceof AppError) {
      res.status(e.status).json({ error: e.code, message: e.message });
      return;
    }
    throw e;
  }
});

adminRouter.patch("/users/:id/status", requireAdmin, requireAdminCsrf, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || typeof req.body?.disabled !== "boolean") {
    res.status(400).json({ error: "INVALID_STATUS", message: "账户状态参数不正确" });
    return;
  }
  const disabled = req.body.disabled;
  const result = getDb().prepare(`UPDATE users SET disabled_at = ? WHERE id = ?`).run(disabled ? Math.floor(Date.now() / 1000) : null, id);
  if (result.changes !== 1) {
    res.status(404).json({ error: "USER_NOT_FOUND", message: "用户不存在" });
    return;
  }
  res.json({ id, disabled });
});

adminRouter.delete("/users/:id", requireAdmin, requireAdminCsrf, (req, res) => {
  const id = Number(req.params.id);
  const result = getDb().prepare(`DELETE FROM users WHERE id = ?`).run(id);
  if (result.changes !== 1) {
    res.status(404).json({ error: "USER_NOT_FOUND", message: "用户不存在" });
    return;
  }
  res.status(204).end();
});

adminRouter.get("/users/:id/transactions", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const db = getDb();
  const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(id);
  if (!user) {
    res.status(404).json({ error: "NOT_FOUND", message: "用户不存在" });
    return;
  }
  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM point_transactions WHERE user_id = ?`)
    .get(id) as { total: number };
  const items = db
    .prepare(
      `SELECT id, type, amount, balance_after, related_divination_id, operator_admin_id, note, created_at
       FROM point_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(id, limit, offset);
  res.json({ page, limit, total, items });
});
