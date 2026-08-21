import { useAuth } from "../lib/auth";
import { Link } from "react-router-dom";

export function AccountPage() {
  const { user } = useAuth();
  if (!user) return <p className="muted">请先入户。</p>;
  return (
    <section>
      <Link to="/" className="page-back">← 返回首页</Link>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "0.28em" }}>账户信息</h2>
      <div style={{ marginTop: 28 }}>
        <p style={{ margin: 0, fontSize: 22, letterSpacing: "0.16em" }}>{user.username}</p>
        <p className="muted" style={{ margin: "8px 0 0" }}>
          {user.email || "微信授权账户"}
        </p>
        <p className="faint" style={{ margin: "16px 0 0", fontSize: 13, lineHeight: 1.8 }}>
          可用次数及购买入口已统一放在首页。
        </p>
      </div>
    </section>
  );
}
