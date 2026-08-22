import { FormEvent, useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CircleDollarSign,
  Database,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { api } from "../lib/api";

type Row = { id: number; email: string; username: string; points: number; created_at: number; disabled_at: number | null };
type Overview = Awaited<ReturnType<typeof api.adminOverview>>;

const number = (value: number) => new Intl.NumberFormat("zh-CN").format(value);

export function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [challengeQuestion, setChallengeQuestion] = useState("");
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [rechargeTarget, setRechargeTarget] = useState<Row | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState("10");
  const [rechargeNote, setRechargeNote] = useState("后台统一充值");

  async function loadChallenge() {
    const next = await api.adminChallenge();
    setChallengeId(next.id);
    setChallengeQuestion(next.question);
    setChallengeAnswer("");
  }

  async function load(q = search) {
    const [users, stats] = await Promise.all([api.adminUsers(q), api.adminOverview()]);
    setItems(users.items);
    setOverview(stats);
  }

  useEffect(() => {
    api.adminMe().then(() => { setAuthed(true); return load(""); }).catch(() => {
      setAuthed(false);
      loadChallenge().catch(() => setErr("无法取得安全校验，请稍后刷新"));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setErr("");
    try {
      await api.adminLogin({ username, password, challengeId, challengeAnswer: Number(challengeAnswer) });
      setAuthed(true);
      await load("");
    } catch (error) {
      setErr((error as Error).message);
      await loadChallenge().catch(() => undefined);
    }
  }

  function openRecharge(user: Row) {
    setErr("");
    setRechargeTarget(user);
    setRechargeAmount("10");
    setRechargeNote("后台统一充值");
  }

  async function submitRecharge(event: FormEvent) {
    event.preventDefault();
    if (!rechargeTarget) return;
    setBusy(true);
    try {
      const amount = Number(rechargeAmount);
      if (!Number.isInteger(amount) || amount <= 0) throw new Error("充值点数必须是正整数");
      await api.recharge(rechargeTarget.id, amount, rechargeNote.trim() || "后台统一充值");
      setRechargeTarget(null);
      await load();
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleUser(user: Row) {
    setBusy(true);
    try {
      await api.setUserStatus(user.id, !user.disabled_at);
      await load();
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(user: Row) {
    if (!window.confirm(`删除「${user.username}」后，其点数流水和历史投射记录也会永久删除，是否继续？`)) return;
    setBusy(true);
    try {
      await api.deleteUser(user.id);
      await load();
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!authed) {
    return (
      <section className="admin-login-screen">
        <div className="admin-login-brand"><span className="admin-logo">P</span><span>PLUM <b>OPS</b></span></div>
        <div className="admin-login-card">
          <div className="admin-login-intro">
            <span className="admin-login-icon"><ShieldCheck size={22} /></span>
            <p className="admin-kicker">SECURE WORKSPACE</p>
            <h2>欢迎回来</h2>
            <p className="admin-subtitle">登录 Plum 管理工作台，查看业务运行状态。</p>
          </div>
          <form onSubmit={login}>
            <div className="field"><label>管理员账号</label><input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></div>
            <div className="field"><label>密码</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
            <div className="field"><label>安全校验</label><div className="challenge-row"><span>{challengeQuestion || "加载中…"}</span><button className="admin-text-button" type="button" onClick={() => loadChallenge()} disabled={busy}><RefreshCw size={14} />换一题</button></div></div>
            <div className="field"><label>校验答案</label><input inputMode="numeric" value={challengeAnswer} onChange={(e) => setChallengeAnswer(e.target.value.replace(/[^0-9]/g, ""))} autoComplete="off" /></div>
            {err ? <p className="err">{err}</p> : null}
            <button className="admin-primary-button" disabled={busy}>进入工作台 <ArrowUpRight size={16} /></button>
          </form>
        </div>
        <p className="admin-login-foot">Private operations console · Plum Node</p>
      </section>
    );
  }

  return (
    <section className="admin-console">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span className="admin-logo">P</span><span>PLUM <b>OPS</b></span></div>
        <div className="admin-sidebar-label">WORKSPACE</div>
        <nav className="admin-nav" aria-label="后台导航">
          <a className="is-active" href="#overview"><LayoutDashboard size={17} />概览</a>
          <a href="#users"><Users size={17} />用户账户</a>
          <a href="#model"><Settings2 size={17} />决策投射服务</a>
          <a href="#ledger"><WalletCards size={17} />点数账本</a>
        </nav>
        <div className="admin-sidebar-spacer" />
        <div className="admin-sidebar-status"><span className="admin-live-dot" />系统运行正常<span>v1.0</span></div>
        <button className="admin-sidebar-logout" type="button" onClick={async () => { await api.adminLogout(); setAuthed(false); await loadChallenge().catch(() => undefined); }}><LogOut size={16} />退出登录</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar"><div className="admin-breadcrumb"><span>PLUM OPS</span><i>/</i><b>工作台</b></div><div className="admin-topbar-meta"><span className="admin-live-dot" />服务端直连<span className="admin-avatar">A</span></div></header>
        <div className="admin-main-inner">
          <header className="admin-heading" id="overview"><div><p className="admin-kicker">OVERVIEW / 运营总览</p><h1>工作台</h1><p>实时查看 Plum 的账户、点数和决策投射服务运行状态。</p></div><div className="admin-heading-date"><Activity size={16} /><span>实时数据</span><b>{new Date().toLocaleDateString("zh-CN")}</b></div></header>

          {err ? <p className="err admin-error">{err}</p> : null}
          <div className="admin-stats">
            <article><div className="admin-stat-icon is-blue"><Users size={18} /></div><span>账户总数</span><strong>{number(overview?.users ?? 0)}</strong><small><ArrowUpRight size={13} />已建立用户</small></article>
            <article><div className="admin-stat-icon is-green"><CircleDollarSign size={18} /></div><span>统一余点</span><strong>{number(overview?.points ?? 0)}</strong><small><ArrowUpRight size={13} />所有账户合计</small></article>
            <article><div className="admin-stat-icon is-orange"><WalletCards size={18} /></div><span>数字投射</span><strong>{number(overview?.plumSpends ?? 0)}</strong><small><ArrowUpRight size={13} />累计消费次数</small></article>
            <article><div className="admin-stat-icon is-purple"><Activity size={18} /></div><span>决策投射</span><strong>{number(overview?.decisionSpends ?? 0)}</strong><small><ArrowUpRight size={13} />累计消费次数</small></article>
          </div>

          <section className="admin-panel admin-users-panel" id="users">
            <div className="admin-panel-head"><div><span className="admin-section-icon is-blue"><Users size={16} /></span><div><p className="admin-kicker">ACCOUNT DIRECTORY</p><h3>用户账户</h3></div></div><span className="admin-count">{number(items.length)} 位用户</span></div>
            <div className="admin-search"><label htmlFor="admin-user-search">检索账户</label><div className="admin-search-input"><Search size={16} /><input id="admin-user-search" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") load(); }} placeholder="搜索用户名或邮箱" /></div><button className="admin-secondary-button" type="button" onClick={() => load()}>查找</button></div>
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>用户</th><th>邮箱</th><th>统一余点</th><th>状态</th><th>注册日期</th><th>操作</th></tr></thead><tbody>{items.map((user) => <tr key={user.id} className={user.disabled_at ? "is-disabled" : ""}><td><div className="admin-user-cell"><span className="admin-user-avatar">{user.username.slice(0, 1).toUpperCase()}</span><div><strong>{user.username}</strong><small>UID #{user.id}</small></div></div></td><td>{user.email || "微信账户"}</td><td><strong className="points-number">{number(user.points)}</strong><small className="table-unit">点</small></td><td>{user.disabled_at ? <span className="status-pill is-warn"><i />已禁用</span> : <span className="status-pill"><i />正常</span>}</td><td>{new Date(user.created_at * 1000).toLocaleDateString("zh-CN")}</td><td><div className="admin-actions"><button className="admin-table-button is-primary" type="button" disabled={busy} onClick={() => openRecharge(user)}>充值</button><button className="admin-table-button" type="button" disabled={busy} onClick={() => toggleUser(user)}>{user.disabled_at ? "启用" : "禁用"}</button><button className="admin-table-button is-danger" type="button" disabled={busy} onClick={() => removeUser(user)}>删除</button></div></td></tr>)}</tbody></table></div>
          </section>

          <div className="admin-grid">
            <section className="admin-panel admin-model-panel" id="model">
                <div className="admin-panel-head"><div><span className="admin-section-icon"><Database size={16} /></span><div><p className="admin-kicker">DECISION PROJECTION SERVICE</p><h3>决策投射服务</h3></div></div><span className={overview?.model.localMock ? "status-pill is-warn" : "status-pill"}><i />{overview?.model.localMock ? "本地模拟" : "服务端直连"}</span></div>
              <p className="admin-panel-copy">决策投射由 Plum Node 服务端直接调用。密钥不进入浏览器，也不再使用独立访问凭证。</p>
              <div className="model-list">{(overview?.model.models ?? []).map((model) => <div className="model-row" key={model.id}><span>{model.id}</span><b>{model.name}</b><em className={model.configured ? "is-ready" : ""}><i />{model.configured ? "已配置" : "未配置"}</em></div>)}</div>
              <p className="admin-panel-foot">调用顺序：{overview?.model.priority.join(" → ") || "未设置"}</p>
            </section>

            <section className="admin-panel" id="ledger">
              <div className="admin-panel-head"><div><span className="admin-section-icon is-green"><WalletCards size={16} /></span><div><p className="admin-kicker">POINT LEDGER</p><h3>统一点数</h3></div></div><span className="status-pill">两种应用共用</span></div>
                <p className="admin-panel-copy">数字投射和决策投射均从同一账户余额原子扣减，充值也只需维护这一处。</p>
                <div className="ledger-key"><span><i className="dot dot-plum" />数字投射 <b>消费</b></span><span><i className="dot dot-decision" />决策投射 <b>消费</b></span><span><i className="dot dot-recharge" />管理员充值 <b>收入</b></span></div>
            </section>
          </div>
        </div>
      </main>
      {rechargeTarget ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setRechargeTarget(null); }}><form className="admin-modal" onSubmit={submitRecharge}><div className="admin-modal-heading"><span className="admin-section-icon is-green"><CircleDollarSign size={17} /></span><div><p className="admin-kicker">POINT LEDGER / MANUAL ENTRY</p><h3>为 {rechargeTarget.username} 充值</h3></div></div><p className="admin-panel-copy">当前余额：<strong className="points-number">{number(rechargeTarget.points)}</strong> 点。充值会立即同时用于数字投射和决策投射。</p><div className="field"><label>充值点数</label><input type="number" min="1" step="1" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} autoFocus /></div><div className="field"><label>备注</label><input value={rechargeNote} onChange={(e) => setRechargeNote(e.target.value)} maxLength={120} /></div><div className="modal-actions"><button className="admin-secondary-button" type="button" onClick={() => setRechargeTarget(null)}>取消</button><button className="admin-primary-button" type="submit" disabled={busy}>确认充值 <ArrowUpRight size={16} /></button></div></form></div> : null}
    </section>
  );
}
