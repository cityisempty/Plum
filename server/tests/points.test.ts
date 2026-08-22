import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { openDatabase } from "../src/db/client.js";
import { hashPassword } from "../src/lib/password.js";
import { AppError, recharge, registerUser, spendAndDivine, spendForDecision, upsertWechatUser } from "../src/lib/points.js";

describe("points", () => {
  it("注册送点并写入流水", () => {
    const db = openDatabase(":memory:");
    const user = registerUser(db, {
      email: "a@b.c",
      username: "甲子",
      passwordHash: hashPassword("password12"),
      bonus: 10,
    }) as { id: number; points: number };
    assert.equal(user.points, 10);
    const txs = db.prepare(`SELECT type, amount, balance_after FROM point_transactions`).all() as Array<{
      type: string;
      amount: number;
      balance_after: number;
    }>;
    assert.equal(txs.length, 1);
    assert.equal(txs[0].type, "register_bonus");
    assert.equal(txs[0].amount, 10);
  });

  it("140792 扣点后得到 00092", () => {
    const db = openDatabase(":memory:");
    const user = registerUser(db, {
      email: "a@b.c",
      username: "甲子",
      passwordHash: hashPassword("password12"),
      bonus: 10,
    }) as { id: number };
    const out = spendAndDivine(db, user.id, "140792");
    assert.equal(out.codeStr, "00092");
    assert.equal(out.hexagramName, "雷地豫");
    assert.equal(out.movingName, "六二");
    assert.equal(out.pointsRemaining, 9);
    assert.equal(out.interpretation.title, "沉心守正，静聚势成");
  });

  it("点数为 0 时拒绝且不写记录", () => {
    const db = openDatabase(":memory:");
    const user = registerUser(db, {
      email: "a@b.c",
      username: "甲子",
      passwordHash: hashPassword("password12"),
      bonus: 0,
    }) as { id: number };
    assert.throws(() => spendAndDivine(db, user.id, "140792"), (e: unknown) => {
      return e instanceof AppError && e.status === 402;
    });
    const n = db.prepare(`SELECT COUNT(*) AS n FROM divinations`).get() as { n: number };
    assert.equal(n.n, 0);
  });

  it("决策投射消费与数字投射使用同一份点数", () => {
    const db = openDatabase(":memory:");
    const user = registerUser(db, {
      email: "a@b.c",
      username: "甲子",
      passwordHash: hashPassword("password12"),
      bonus: 2,
    }) as { id: number };
    assert.equal(spendForDecision(db, user.id).pointsRemaining, 1);
    assert.equal(spendAndDivine(db, user.id, "140792").pointsRemaining, 0);
    assert.throws(() => spendForDecision(db, user.id), (e: unknown) => e instanceof AppError && e.status === 402);
    const txs = db.prepare(`SELECT type FROM point_transactions WHERE user_id = ? ORDER BY id`).all(user.id) as Array<{ type: string }>;
    assert.deepEqual(txs.map((tx) => tx.type), ["register_bonus", "decision_spend", "divination_spend"]);
  });

  it("1 点并发 10 次只成功 1 次", () => {
    const db = openDatabase(":memory:");
    const user = registerUser(db, {
      email: "a@b.c",
      username: "甲子",
      passwordHash: hashPassword("password12"),
      bonus: 1,
    }) as { id: number };
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < 10; i++) {
      try {
        spendAndDivine(db, user.id, "140792");
        ok++;
      } catch {
        fail++;
      }
    }
    assert.equal(ok, 1);
    assert.equal(fail, 9);
    const { points } = db.prepare(`SELECT points FROM users WHERE id = ?`).get(user.id) as { points: number };
    assert.equal(points, 0);
  });

  it("管理员充值写流水", () => {
    const db = openDatabase(":memory:");
    const user = registerUser(db, {
      email: "a@b.c",
      username: "甲子",
      passwordHash: hashPassword("password12"),
      bonus: 2,
    }) as { id: number };
    const out = recharge(db, 1, user.id, 5, "补点");
    assert.equal(out.pointsBalance, 7);
    const { points } = db.prepare(`SELECT points FROM users WHERE id = ?`).get(user.id) as { points: number };
    assert.equal(points, 7);
  });

  it("微信授权首次赠点，再次登录不重复赠", () => {
    const db = openDatabase(":memory:");
    const first = upsertWechatUser(db, {
      openid: "o_abc",
      nickname: "张三",
      avatar: "",
      bonus: 100,
    }) as { id: number; points: number; username: string };
    assert.equal(first.points, 100);
    assert.equal(first.username, "张三");
    const second = upsertWechatUser(db, {
      openid: "o_abc",
      nickname: "张三改",
      avatar: "http://a",
      bonus: 100,
    }) as { id: number; points: number; username: string };
    assert.equal(second.id, first.id);
    assert.equal(second.points, 100);
    assert.equal(second.username, "张三改");
    const { n } = db.prepare(`SELECT COUNT(*) AS n FROM users`).get() as { n: number };
    assert.equal(n, 1);
  });
});
