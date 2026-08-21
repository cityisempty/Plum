import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { divinationRouter } from "./routes/divination.js";
import { decisionRouter } from "./routes/decision.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());

  const windowMs = 60 * 1000;
  app.use("/api/", rateLimit({ windowMs, max: 120, standardHeaders: true, legacyHeaders: false }));
  app.use(
    "/api/auth/register",
    rateLimit({ windowMs: 60 * 60 * 1000, max: 8, standardHeaders: true, legacyHeaders: false }),
  );
  app.use(
    "/api/auth/login",
    rateLimit({ windowMs, max: 20, standardHeaders: true, legacyHeaders: false }),
  );
  app.use(
    "/api/admin/login",
    rateLimit({ windowMs: 15 * 60 * 1000, max: 8, standardHeaders: true, legacyHeaders: false }),
  );
  app.use(
    "/api/admin/challenge",
    rateLimit({ windowMs, max: 20, standardHeaders: true, legacyHeaders: false }),
  );
  app.use(
    "/api/auth/wechat",
    rateLimit({ windowMs, max: 30, standardHeaders: true, legacyHeaders: false }),
  );

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/divinations", divinationRouter);
  app.use("/api/decision", decisionRouter);
  app.use("/api/admin", adminRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "INTERNAL", message: "服务器出错" });
  });

  return app;
}
