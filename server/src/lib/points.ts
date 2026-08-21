import type { Interpretation } from "./interpretations.js";
import { getInterpretation } from "./interpretations.js";
import { divine } from "./meihua.js";
import type { Db } from "../db/client.js";

export class AppError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function registerUser(
  db: Db,
  input: { email: string; username: string; passwordHash: string; bonus: number },
) {
  return db.transaction(() => {
    let info;
    try {
      info = db
        .prepare(
          `INSERT INTO users (email, username, password_hash, points) VALUES (?, ?, ?, ?)`,
        )
        .run(input.email, input.username, input.passwordHash, input.bonus);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("UNIQUE")) {
        throw new AppError(409, "DUPLICATE", "邮箱或用户名已存在");
      }
      throw e;
    }
    const userId = Number(info.lastInsertRowid);
    db.prepare(
      `INSERT INTO point_transactions (user_id, type, amount, balance_after, note)
       VALUES (?, 'register_bonus', ?, ?, '注册赠送')`,
    ).run(userId, input.bonus, input.bonus);
    return db.prepare(`SELECT id, email, username, points, created_at, avatar_url FROM users WHERE id = ?`).get(userId);
  })();
}

export type WechatUserInput = {
  openid: string;
  unionid?: string;
  nickname: string;
  avatar: string;
  bonus: number;
};

export function upsertWechatUser(db: Db, input: WechatUserInput) {
  return db.transaction(() => {
    const existing = db
      .prepare(`SELECT id, email, username, points, created_at, avatar_url FROM users WHERE wechat_openid = ?`)
      .get(input.openid) as
      | { id: number; email: string | null; username: string; points: number; created_at: number; avatar_url: string | null }
      | undefined;
    if (existing) {
      db.prepare(`UPDATE users SET username = ?, avatar_url = ?, wechat_unionid = COALESCE(?, wechat_unionid) WHERE id = ?`).run(
        input.nickname || existing.username,
        input.avatar || existing.avatar_url,
        input.unionid ?? null,
        existing.id,
      );
      return db
        .prepare(`SELECT id, email, username, points, created_at, avatar_url FROM users WHERE id = ?`)
        .get(existing.id);
    }
    const info = db
      .prepare(
        `INSERT INTO users (email, username, password_hash, wechat_openid, wechat_unionid, avatar_url, points)
         VALUES (NULL, ?, NULL, ?, ?, ?, ?)`,
      )
      .run(input.nickname || "微信用户", input.openid, input.unionid ?? null, input.avatar || null, input.bonus);
    const userId = Number(info.lastInsertRowid);
    db.prepare(
      `INSERT INTO point_transactions (user_id, type, amount, balance_after, note)
       VALUES (?, 'register_bonus', ?, ?, '微信授权赠送')`,
    ).run(userId, input.bonus, input.bonus);
    return db.prepare(`SELECT id, email, username, points, created_at, avatar_url FROM users WHERE id = ?`).get(userId);
  })();
}

export function spendAndDivine(db: Db, userId: number, number: string) {
  return db.transaction(() => {
    const r = db.prepare(`UPDATE users SET points = points - 1 WHERE id = ? AND points >= 1`).run(userId);
    if (r.changes !== 1) {
      throw new AppError(402, "POINTS_INSUFFICIENT", "点数不足");
    }
    const { points } = db.prepare(`SELECT points FROM users WHERE id = ?`).get(userId) as { points: number };
    const result = divine(number);
    const interp: Interpretation = getInterpretation(result.codeStr);

    const div = db
      .prepare(
        `INSERT INTO divinations (
          user_id, input, upper, lower, hexagram_order, hexagram_name,
          moving_line, moving_name, code, title, summary, interpretation_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        userId,
        result.input,
        result.upper,
        result.lower,
        result.hexagramOrder,
        result.hexagramName,
        result.movingLine,
        result.movingName,
        result.code,
        interp.title,
        interp.summary,
        JSON.stringify(interp),
      );

    const divId = Number(div.lastInsertRowid);
    db.prepare(
      `INSERT INTO point_transactions
        (user_id, type, amount, balance_after, related_divination_id, note)
       VALUES (?, 'divination_spend', -1, ?, ?, '起卦')`,
    ).run(userId, points, divId);

    return {
      id: divId,
      ...result,
      interpretation: interp,
      pointsRemaining: points,
    };
  })();
}

export function spendForDecision(db: Db, userId: number) {
  return db.transaction(() => {
    const r = db.prepare(`UPDATE users SET points = points - 1 WHERE id = ? AND points >= 1`).run(userId);
    if (r.changes !== 1) {
      throw new AppError(402, "POINTS_INSUFFICIENT", "点数不足");
    }
    const { points } = db.prepare(`SELECT points FROM users WHERE id = ?`).get(userId) as { points: number };
    db.prepare(
      `INSERT INTO point_transactions (user_id, type, amount, balance_after, note)
       VALUES (?, 'decision_spend', -1, ?, '决策模型解读')`,
    ).run(userId, points);
    return { pointsRemaining: points };
  })();
}

export function recharge(
  db: Db,
  adminId: number,
  userId: number,
  amount: number,
  note: string,
) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new AppError(400, "INVALID_AMOUNT", "充值数量须为正整数");
  }
  return db.transaction(() => {
    const r = db.prepare(`UPDATE users SET points = points + ? WHERE id = ?`).run(amount, userId);
    if (r.changes !== 1) {
      throw new AppError(404, "USER_NOT_FOUND", "用户不存在");
    }
    const { points } = db.prepare(`SELECT points FROM users WHERE id = ?`).get(userId) as { points: number };
    const tx = db
      .prepare(
        `INSERT INTO point_transactions
          (user_id, type, amount, balance_after, operator_admin_id, note)
         VALUES (?, 'admin_recharge', ?, ?, ?, ?)`,
      )
      .run(userId, amount, points, adminId, note || "管理员充值");
    return {
      userId,
      pointsAdded: amount,
      pointsBalance: points,
      transactionId: Number(tx.lastInsertRowid),
    };
  })();
}
