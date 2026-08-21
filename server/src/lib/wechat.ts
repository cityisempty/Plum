import crypto from "node:crypto";
import { config } from "./config.js";
import { AppError } from "./points.js";

export type WechatProfile = {
  openid: string;
  unionid?: string;
  nickname: string;
  avatar: string;
};

const STATE_TTL_MS = 10 * 60 * 1000;

function signState(payload: string): string {
  return crypto.createHmac("sha256", config.jwtSecret).update(payload).digest("hex").slice(0, 24);
}

export function makeOauthState(redirect: string): string {
  const body = JSON.stringify({ r: redirect, t: Date.now(), n: crypto.randomBytes(6).toString("hex") });
  const b64 = Buffer.from(body).toString("base64url");
  return `${b64}.${signState(b64)}`;
}

export function parseOauthState(state: string): string {
  const [b64, sig] = state.split(".");
  if (!b64 || !sig || signState(b64) !== sig) {
    throw new AppError(400, "BAD_STATE", "授权状态无效");
  }
  const data = JSON.parse(Buffer.from(b64, "base64url").toString("utf8")) as { r?: string; t?: number };
  if (!data.t || Date.now() - data.t > STATE_TTL_MS) {
    throw new AppError(400, "STATE_EXPIRED", "授权已过期，请重试");
  }
  const r = String(data.r || "/");
  if (!r.startsWith("/") || r.startsWith("//")) return "/";
  return r;
}

export function buildWechatRedirectUri(publicBaseUrl: string, serviceAccountCallbackUrl = ""): string {
  const callbackUrl = serviceAccountCallbackUrl.trim();
  if (callbackUrl) return callbackUrl;
  return `${publicBaseUrl.replace(/\/$/, "")}/api/auth/wechat/callback`;
}

export function authorizeUrl(state: string): string {
  const redirectUri = encodeURIComponent(buildWechatRedirectUri(config.publicBaseUrl, config.wechatServiceAccountCallbackUrl));
  const appId = config.wechatAppId;
  return (
    `https://open.weixin.qq.com/connect/oauth2/authorize` +
    `?appid=${encodeURIComponent(appId)}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code&scope=snsapi_userinfo` +
    `&state=${encodeURIComponent(state)}#wechat_redirect`
  );
}

export async function fetchWechatProfile(code: string): Promise<WechatProfile> {
  if (config.wechatMock) {
    const tag = code.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "dev";
    return {
      openid: `mock_${tag}`,
      nickname: "微信用户",
      avatar: "",
    };
  }
  if (!config.wechatAppId || !config.wechatAppSecret) {
    throw new AppError(500, "WECHAT_UNCONFIGURED", "尚未配置微信公众号");
  }

  const tokenUrl =
    `https://api.weixin.qq.com/sns/oauth2/access_token` +
    `?appid=${encodeURIComponent(config.wechatAppId)}` +
    `&secret=${encodeURIComponent(config.wechatAppSecret)}` +
    `&code=${encodeURIComponent(code)}&grant_type=authorization_code`;
  const token = (await (await fetch(tokenUrl)).json()) as {
    access_token?: string;
    openid?: string;
    errmsg?: string;
  };
  if (!token.access_token || !token.openid) {
    throw new AppError(401, "WECHAT_TOKEN", token.errmsg || "微信授权失败");
  }

  const infoUrl =
    `https://api.weixin.qq.com/sns/userinfo` +
    `?access_token=${encodeURIComponent(token.access_token)}` +
    `&openid=${encodeURIComponent(token.openid)}&lang=zh_CN`;
  const info = (await (await fetch(infoUrl)).json()) as {
    openid?: string;
    unionid?: string;
    nickname?: string;
    headimgurl?: string;
    errmsg?: string;
  };
  if (!info.openid) {
    throw new AppError(401, "WECHAT_PROFILE", info.errmsg || "无法读取微信资料");
  }
  return {
    openid: info.openid,
    unionid: info.unionid,
    nickname: info.nickname || "微信用户",
    avatar: info.headimgurl || "",
  };
}
