import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { COOKIE_ADMIN, COOKIE_USER } from "../lib/config.js";
import { ADMIN_CSRF_COOKIE } from "../lib/http.js";
import { getDb } from "../db/client.js";
import { verifyToken, type AdminClaims, type UserClaims } from "../lib/jwt.js";

export type AuthedRequest = Request & { userId?: number; adminId?: number };

export function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_USER];
  if (!token) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "请先登录" });
    return;
  }
  try {
    const claims = verifyToken(token);
    if (claims.typ !== "user") {
      res.status(401).json({ error: "UNAUTHORIZED", message: "请先登录" });
      return;
    }
    req.userId = (claims as UserClaims).uid;
    const user = getDb().prepare(`SELECT disabled_at FROM users WHERE id = ?`).get(req.userId) as { disabled_at: number | null } | undefined;
    if (!user || user.disabled_at) {
      res.status(403).json({ error: "USER_DISABLED", message: "账户已被停用，请联系管理员" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: "UNAUTHORIZED", message: "登录已过期" });
  }
}

export function requireAdminCsrf(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = String(req.get("x-csrf-token") ?? "");
  const cookie = String(req.cookies?.[ADMIN_CSRF_COOKIE] ?? "");
  if (!header || !cookie || header.length !== cookie.length || !cryptoSafeEqual(header, cookie)) {
    res.status(403).json({ error: "CSRF_INVALID", message: "安全校验失败，请刷新后台后重试" });
    return;
  }
  next();
}

function cryptoSafeEqual(a: string, b: string) {
  if (!a || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_ADMIN];
  if (!token) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "请先以管理员登录" });
    return;
  }
  try {
    const claims = verifyToken(token);
    if (claims.typ !== "admin") {
      res.status(403).json({ error: "FORBIDDEN", message: "需要管理员权限" });
      return;
    }
    req.adminId = (claims as AdminClaims).aid;
    next();
  } catch {
    res.status(401).json({ error: "UNAUTHORIZED", message: "登录已过期" });
  }
}
