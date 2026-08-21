import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export function RegisterPage() {
  const { setUser } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!agree) {
      setErr("请先阅读并同意用户协议与免责声明");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const { user } = await api.register({ email, username, password });
      setUser(user);
      nav("/");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "0.28em" }}>立 册</h2>
      <div className="field">
        <label>邮箱</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className="field">
        <label>名号</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
      </div>
      <div className="field">
        <label>密语（八位以上）</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </div>
      <label style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7 }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>
          已阅读并同意 <Link to="/terms">用户协议</Link>、<Link to="/privacy">隐私政策</Link> 与{" "}
          <Link to="/disclaimer">免责声明</Link>
        </span>
      </label>
      {err ? <p className="err">{err}</p> : null}
      <button className="btn-cinnabar" disabled={busy} style={{ marginTop: 20 }}>
        立
      </button>
      <p className="muted" style={{ marginTop: 24, fontSize: 13 }}>
        已有册籍？ <Link to="/login">去登录</Link>
      </p>
    </form>
  );
}
