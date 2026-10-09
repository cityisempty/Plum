import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export function LoginPage() {
  const loc = useLocation() as { state?: { next?: string } };
  const next = loc.state?.next || "/";
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { user } = await api.login({ email, password });
      setUser(user);
      nav(next, { replace: true });
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ maxWidth: 360, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "0.28em", textAlign: "center" }}>入 户</h2>
      <p className="muted" style={{ lineHeight: 1.8, textAlign: "center" }}>
        电脑浏览器可使用邮箱密码登录；微信内也可以直接授权。
      </p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>邮箱</label>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        </div>
        <div className="field">
          <label>密码</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        </div>
        {err ? <p className="err">{err}</p> : null}
        <button className="btn-cinnabar" type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "登录中…" : "邮箱登录"}
        </button>
      </form>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0", color: "var(--ink-faint)", fontSize: 12 }}>
        <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
        <span>或</span>
        <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
      </div>
      <button className="btn-ghost" type="button" onClick={() => api.wechatStart(next)} style={{ width: "100%" }}>
        微信授权
      </button>
      <p className="muted" style={{ marginTop: 24, fontSize: 13, textAlign: "center" }}>
        没有账户？ <Link to="/register">注册账户</Link>
      </p>
      <p className="faint" style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
        管理员请走 <Link to="/admin">案牍</Link>
      </p>
    </section>
  );
}
