import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(SERVER_ROOT, ".env") });

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") {
    throw new Error(`Missing env ${name}`);
  }
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 8787),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databasePath: path.resolve(SERVER_ROOT, process.env.DATABASE_PATH ?? "./data/plum.db"),
  jwtSecret: req("JWT_SECRET", "dev-only-change-me-please-32chars!!"),
  jwtTtl: process.env.JWT_TTL ?? "2h",
  adminUser: process.env.ADMIN_INIT_USERNAME ?? "admin",
  adminPassword: process.env.ADMIN_INIT_PASSWORD ?? "change-me-admin-pass",
  registerBonus: Number(process.env.REGISTER_BONUS_POINTS ?? 100),
  cookieSecure: (process.env.COOKIE_SECURE ?? "false") === "true",
  isProd: (process.env.NODE_ENV ?? "development") === "production",
  serverRoot: SERVER_ROOT,
  wechatAppId: process.env.WECHAT_APP_ID ?? "",
  wechatAppSecret: process.env.WECHAT_APP_SECRET ?? "",
  wechatMock: (process.env.WECHAT_MOCK ?? "true") === "true",
  wechatServiceAccountCallbackUrl: process.env.WECHAT_SERVICE_ACCOUNT_CALLBACK_URL ?? "",
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:5173",
  modelPriority: process.env.MODEL_PRIORITY ?? "gemini,openai,custom",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.0-flash-exp",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  customApiKey: process.env.CUSTOM_API_KEY ?? "",
  customBaseUrl: process.env.CUSTOM_BASE_URL ?? "",
  customModel: process.env.CUSTOM_MODEL ?? "gpt-3.5-turbo",
  decisionLocalMock: (process.env.DECISION_LOCAL_MOCK ?? (process.env.NODE_ENV === "production" ? "false" : "true")) === "true",
};

if (config.isProd) {
  if (config.adminPassword === "change-me-admin-pass") {
    throw new Error("ADMIN_INIT_PASSWORD must be changed before production startup");
  }
  if (config.jwtSecret === "dev-only-change-me-please-32chars!!" || config.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be a random value of at least 32 characters in production");
  }
  if (!config.cookieSecure) {
    throw new Error("COOKIE_SECURE=true is required in production");
  }
}

export const COOKIE_USER = "plum_token";
export const COOKIE_ADMIN = "plum_admin";
