import crypto from "node:crypto";
import type { CookieOptions, Response } from "express";
import { config, COOKIE_ADMIN, COOKIE_USER } from "../lib/config.js";

export function cookieOpts(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: config.cookieSecure,
    path: "/",
    maxAge: 2 * 60 * 60 * 1000,
  };
}

export function setUserCookie(res: Response, token: string) {
  res.cookie(COOKIE_USER, token, cookieOpts());
}

export function setAdminCookie(res: Response, token: string) {
  res.cookie(COOKIE_ADMIN, token, cookieOpts());
}

export const ADMIN_CSRF_COOKIE = "plum_admin_csrf";

export function issueAdminCsrf(res: Response) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(ADMIN_CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "strict",
    secure: config.cookieSecure,
    path: "/",
    maxAge: 2 * 60 * 60 * 1000,
  });
  return token;
}

export function clearUserCookie(res: Response) {
  res.clearCookie(COOKIE_USER, { path: "/" });
}

export function clearAdminCookie(res: Response) {
  res.clearCookie(COOKIE_ADMIN, { path: "/" });
  res.clearCookie(ADMIN_CSRF_COOKIE, { path: "/" });
}

export function publicUser(row: {
  id: number;
  email?: string | null;
  username: string;
  points: number;
  created_at: number;
  avatar_url?: string | null;
}) {
  return {
    id: row.id,
    email: row.email ?? "",
    username: row.username,
    points: row.points,
    createdAt: row.created_at,
    avatarUrl: row.avatar_url ?? "",
  };
}
