import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

const APPS = [
  {
    id: "plum",
    name: "数字投射解码",
    subtitle: "六位数字 · 投射解码",
    to: "/apps/plum",
    seal: "问",
  },
  {
    id: "decision",
    name: "决策投射评测",
    subtitle: "九宫格卡牌 · 看见你的选择",
    to: "/apps/decision",
    seal: "决",
  },
];

export function HubPage() {
  const { user, loading, setUser } = useAuth();
  const nav = useNavigate();
  const [showPurchase, setShowPurchase] = useState(false);

  async function logout() {
    await api.logout();
    setUser(null);
  }

  return (
    <section className="hub">
      <header className={`hub-hero${user ? " is-authenticated" : ""}`}>
        {user ? (
          <>
            <div className="hub-avatar">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span>{user.username.slice(0, 1)}</span>}
            </div>
            <div className="hub-meta">
              <p className="hub-eyebrow">欢迎回来</p>
              <h2>{user.username}</h2>
              <p>统一可用次数 {user.points}</p>
            </div>
            <div className="hub-actions">
              <button className="btn-ghost hub-recharge" type="button" onClick={() => setShowPurchase(true)}>
                购买次数
              </button>
              <button className="btn-ghost" type="button" onClick={logout}>
                退出
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="hub-avatar">
              <span>问</span>
            </div>
            <div className="hub-meta">
              <p className="hub-eyebrow">欢迎来到这里</p>
              <h2>从一个问题开始</h2>
              <p>登录后即可保存你的解读记录</p>
            </div>
            <button
              className="btn-cinnabar"
              type="button"
              disabled={loading}
              onClick={() => api.wechatStart("/")}
            >
              登录
            </button>
          </>
        )}
      </header>

      <div className="hub-section-head">
        <h3>开始一次解读</h3>
        <span>01</span>
      </div>
      <div className="hub-grid">
        {APPS.map((app) => (
          <button
            key={app.id}
            className="hub-app"
            type="button"
            onClick={() => {
              if (!user) {
                api.wechatStart(app.to);
                return;
              }
              nav(app.to);
            }}
          >
            <span className="hub-app-topline">
              <span className="hub-app-seal">{app.seal}</span>
              <span className="hub-app-index">{app.id === "plum" ? "六位数字" : "九宫格卡牌"}</span>
            </span>
            <span className="hub-app-copy">
              <strong>{app.name}</strong>
              <em>把问题变成清晰的起点</em>
            </span>
            <span className="hub-app-action">开始解读 <b>↗</b></span>
          </button>
        ))}
        <div className="hub-app is-soon" aria-hidden>
          <span className="hub-app-topline">
            <span className="hub-app-seal">+</span>
            <span className="hub-app-index">COMING SOON</span>
          </span>
          <span className="hub-app-copy">
            <strong>更多工具</strong>
            <em>正在准备中</em>
          </span>
        </div>
      </div>

      {user ? (
        <p className="hub-links">
          <Link to="/history">历史记录</Link>
          <Link to="/account">账户设置</Link>
        </p>
      ) : (
        <p className="hub-note">登录后可查看历史解读，并获得完整体验。</p>
      )}

      {showPurchase ? (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="purchase-title" onClick={() => setShowPurchase(false)}>
          <div className="modal-panel hub-purchase" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3 id="purchase-title">购买次数</h3>
              <button type="button" aria-label="关闭" onClick={() => setShowPurchase(false)}>×</button>
            </header>
            <div className="hub-purchase-body">
              <p>数字投射解码与决策投射共用同一份次数。</p>
              <p>请联系管理员购买或充值。完成后，次数会直接加到当前账户，无需再输入额外访问凭证。</p>
              <button className="btn-cinnabar" type="button" onClick={() => setShowPurchase(false)}>我知道了</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
