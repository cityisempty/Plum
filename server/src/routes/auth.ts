import { Router } from "express";
import { getDb } from "../db/client.js";
import { config } from "../lib/config.js";
import { clearUserCookie, publicUser, setUserCookie } from "../lib/http.js";
import { signUser } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { AppError, registerUser, upsertWechatUser } from "../lib/points.js";
import { authorizeUrl, fetchWechatProfile, makeOauthState, parseOauthState } from "../lib/wechat.js";
import { requireUser, type AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNext(raw: unknown): string {
  const s = String(raw ?? "/");
  if (!s.startsWith("/") || s.startsWith("//")) return "/";
  return s;
}

authRouter.post("/register", (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const username = String(req.body?.username ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: "INVALID_EMAIL", message: "邮箱格式不正确" });
    return;
  }
  if (username.length < 2 || username.length > 20) {
    res.status(400).json({ error: "INVALID_USERNAME", message: "用户名须为 2–20 字" });
    return;
  }
  if (password.length < 8 || password.length > 64) {
    res.status(400).json({ error: "INVALID_PASSWORD", message: "密码须为 8–64 位" });
    return;
  }

  try {
    const user = registerUser(getDb(), {
      email,
      username,
      passwordHash: hashPassword(password),
      bonus: config.registerBonus,
    }) as { id: number; email: string; username: string; points: number; created_at: number; avatar_url?: string | null };
    setUserCookie(res, signUser(user.id));
    res.status(201).json({ user: publicUser(user) });
  } catch (e) {
    if (e instanceof AppError) {
      res.status(e.status).json({ error: e.code, message: e.message });
      return;
    }
    throw e;
  }
});

authRouter.post("/login", (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const row = getDb()
    .prepare(`SELECT id, email, username, points, created_at, password_hash, avatar_url, disabled_at FROM users WHERE email = ?`)
    .get(email) as
    | {
        id: number;
        email: string;
        username: string;
        points: number;
        created_at: number;
        password_hash: string | null;
        avatar_url: string | null;
        disabled_at: number | null;
      }
    | undefined;
  if (!row || row.disabled_at || !row.password_hash || !verifyPassword(password, row.password_hash)) {
    res.status(401).json({ error: "BAD_CREDENTIALS", message: "邮箱或密码错误" });
    return;
  }
  setUserCookie(res, signUser(row.id));
  res.json({ user: publicUser(row) });
});

authRouter.post("/logout", (_req, res) => {
  clearUserCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireUser, (req: AuthedRequest, res) => {
  const row = getDb()
    .prepare(`SELECT id, email, username, points, created_at, avatar_url FROM users WHERE id = ?`)
    .get(req.userId) as
    | { id: number; email: string | null; username: string; points: number; created_at: number; avatar_url: string | null }
    | undefined;
  if (!row) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "用户不存在" });
    return;
  }
  res.json({ user: publicUser(row) });
});

authRouter.get("/wechat", (req, res) => {
  const next = safeNext(req.query.next);
  const state = makeOauthState(next);
  if (config.wechatMock) {
    res.redirect(`/api/auth/wechat/callback?code=dev&state=${encodeURIComponent(state)}`);
    return;
  }
  if (!config.wechatAppId) {
    res.status(500).json({ error: "WECHAT_UNCONFIGURED", message: "尚未配置 WECHAT_APP_ID" });
    return;
  }
  res.redirect(authorizeUrl(state));
});

authRouter.get("/wechat/callback", async (req, res) => {
  try {
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? "");
    if (!code) {
      res.status(400).send("缺少 code");
      return;
    }
    const next = state ? parseOauthState(state) : "/";
    const profile = await fetchWechatProfile(code);
    const user = upsertWechatUser(getDb(), {
      openid: profile.openid,
      unionid: profile.unionid,
      nickname: profile.nickname,
      avatar: profile.avatar,
      bonus: config.registerBonus,
    }) as { id: number };
    const current = getDb().prepare(`SELECT disabled_at FROM users WHERE id = ?`).get(user.id) as { disabled_at: number | null } | undefined;
    if (!current || current.disabled_at) {
      res.status(403).send("账户已被停用，请联系管理员");
      return;
    }
    setUserCookie(res, signUser(user.id));
    res.redirect(next);
  } catch (e) {
    const msg = e instanceof AppError ? e.message : "微信登录失败";
    res.status(400).send(msg);
  }
});
