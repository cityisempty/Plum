import { FormEvent, useEffect, useState } from "react";
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
      <section className="admin-login">
        <p className="admin-kicker">PLUM / PRIVATE CONSOLE</p>
        <h2>案 牍</h2>
        <p className="admin-subtitle">统一用户、点数与决策模型的内部后台</p>
        <form onSubmit={login}>
          <div className="field"><label>案名</label><input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></div>
          <div className="field"><label>密语</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
          <div className="field"><label>校验题</label><div className="challenge-row"><span>{challengeQuestion || "加载中…"}</span><button className="btn-ghost btn-small" type="button" onClick={() => loadChallenge()} disabled={busy}>换一题</button></div></div>
          <div className="field"><label>答案</label><input inputMode="numeric" value={challengeAnswer} onChange={(e) => setChallengeAnswer(e.target.value.replace(/[^0-9]/g, ""))} autoComplete="off" /></div>
          {err ? <p className="err">{err}</p> : null}
          <button className="btn-cinnabar" disabled={busy}>进入后台</button>
        </form>
      </section>
    );
  }

  return (
    <section className="admin-console">
      <header className="admin-header">
        <div><p className="admin-kicker">PLUM / PRIVATE CONSOLE</p><h2>案 牍</h2><p className="admin-subtitle">统一管理用户、点数与模型服务</p></div>
        <button className="btn-ghost" type="button" onClick={async () => { await api.adminLogout(); setAuthed(false); await loadChallenge().catch(() => undefined); }}>退出</button>
      </header>

      {err ? <p className="err">{err}</p> : null}
      <div className="admin-stats">
        <article><span>账户</span><strong>{number(overview?.users ?? 0)}</strong><small>已建立用户</small></article>
        <article><span>统一余点</span><strong>{number(overview?.points ?? 0)}</strong><small>所有账户合计</small></article>
        <article><span>数字投射</span><strong>{number(overview?.plumSpends ?? 0)}</strong><small>累计消费次数</small></article>
        <article><span>决策模型</span><strong>{number(overview?.decisionSpends ?? 0)}</strong><small>累计消费次数</small></article>
      </div>

      <div className="admin-grid">
        <section className="admin-panel admin-model-panel">
          <div className="admin-panel-head"><div><p className="admin-kicker">MODEL ROOM</p><h3>模型服务</h3></div><span className={overview?.model.localMock ? "status-pill is-warn" : "status-pill"}>{overview?.model.localMock ? "本地模拟" : "服务端直连"}</span></div>
          <p className="admin-panel-copy">决策模型由 Plum Node 服务端直接调用。密钥不进入浏览器，也不再使用独立访问凭证。</p>
          <div className="model-list">{(overview?.model.models ?? []).map((model) => <div className="model-row" key={model.id}><span>{model.id}</span><b>{model.name}</b><em className={model.configured ? "is-ready" : ""}>{model.configured ? "已配置" : "未配置"}</em></div>)}</div>
          <p className="admin-panel-foot">调用顺序：{overview?.model.priority.join(" → ") || "未设置"}</p>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head"><div><p className="admin-kicker">POINT LEDGER</p><h3>统一点数</h3></div><span className="status-pill">两种应用共用</span></div>
          <p className="admin-panel-copy">数字投射和决策模型均从同一账户余额原子扣减，充值也只需维护这一处。</p>
          <div className="ledger-key"><span><i className="dot dot-plum" />数字投射</span><span><i className="dot dot-decision" />决策模型</span><span><i className="dot dot-recharge" />管理员充值</span></div>
        </section>
      </div>

      <section className="admin-panel admin-users-panel">
        <div className="admin-panel-head"><div><p className="admin-kicker">ACCOUNT LEDGER</p><h3>用户账户</h3></div><span className="admin-count">{number(items.length)} / 当前页</span></div>
        <div className="admin-search"><label>检索账户</label><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") load(); }} placeholder="用户名或邮箱" /><button className="btn-ghost" type="button" onClick={() => load()}>查阅</button></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>号</th><th>名</th><th>邮</th><th>统一余点</th><th>状态</th><th>入档时间</th><th>操作</th></tr></thead><tbody>{items.map((user) => <tr key={user.id} className={user.disabled_at ? "is-disabled" : ""}><td>#{user.id}</td><td>{user.username}</td><td>{user.email || "微信账户"}</td><td><strong className="points-number">{user.points}</strong></td><td>{user.disabled_at ? <span className="status-pill is-warn">已禁用</span> : <span className="status-pill">正常</span>}</td><td>{new Date(user.created_at * 1000).toLocaleDateString("zh-CN")}</td><td><div className="admin-actions"><button className="btn-ghost btn-small" type="button" disabled={busy} onClick={() => openRecharge(user)}>添点</button><button className="btn-ghost btn-small" type="button" disabled={busy} onClick={() => toggleUser(user)}>{user.disabled_at ? "启用" : "禁用"}</button><button className="btn-danger btn-small" type="button" disabled={busy} onClick={() => removeUser(user)}>删除</button></div></td></tr>)}</tbody></table></div>
      </section>
      {rechargeTarget ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setRechargeTarget(null); }}><form className="admin-modal" onSubmit={submitRecharge}><p className="admin-kicker">POINT LEDGER / MANUAL ENTRY</p><h3>为 {rechargeTarget.username} 充值</h3><p className="admin-panel-copy">当前余额：<strong className="points-number">{rechargeTarget.points}</strong> 点。充值会立即同时用于数字投射和决策模型。</p><div className="field"><label>充值点数</label><input type="number" min="1" step="1" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} autoFocus /></div><div className="field"><label>备注</label><input value={rechargeNote} onChange={(e) => setRechargeNote(e.target.value)} maxLength={120} /></div><div className="modal-actions"><button className="btn-ghost" type="button" onClick={() => setRechargeTarget(null)}>取消</button><button className="btn-cinnabar" type="submit" disabled={busy}>确认充值</button></div></form></div> : null}
    </section>
  );
}
