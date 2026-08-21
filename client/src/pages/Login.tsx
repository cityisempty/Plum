import { Link, useLocation } from "react-router-dom";
import { api } from "../lib/api";

export function LoginPage() {
  const loc = useLocation() as { state?: { next?: string } };
  const next = loc.state?.next || "/";

  return (
    <section style={{ maxWidth: 360, margin: "0 auto", textAlign: "center" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "0.28em" }}>入 户</h2>
      <p className="muted" style={{ lineHeight: 1.8 }}>
        使用微信公众号授权登录，首次获赠一百点。
      </p>
      <button className="btn-cinnabar" type="button" onClick={() => api.wechatStart(next)}>
        微信授权
      </button>
      <p className="faint" style={{ marginTop: 28, fontSize: 13 }}>
        管理员请走 <Link to="/admin">案牍</Link>
      </p>
    </section>
  );
}
