import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BreathBloom } from "../components/BreathBloom";
import { DigitInput } from "../components/DigitInput";
import { AnalysisTransition } from "../components/AnalysisTransition";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export function PlumPage() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ready = digits.length === 6;

  async function submit() {
    setErr("");
    if (!ready) return;
    if (!user) {
      api.wechatStart("/apps/plum");
      return;
    }
    setBusy(true);
    try {
      const [out] = await Promise.all([
        api.divine(digits),
        new Promise((resolve) => window.setTimeout(resolve, 3000)),
      ]);
      setUser({ ...user, points: out.pointsRemaining });
      nav(`/apps/plum/result/${out.id}`, { state: { result: out } });
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 402) setErr("余点不足，请至户籍或请管理员添点。");
      else setErr(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flow is-input">
      {busy ? <AnalysisTransition digits={digits} /> : null}
      <header className="flow-bar">
        <Link to="/" className="flow-back" aria-label="返回">
          ‹
        </Link>
        <h1>数字投射解码</h1>
        <span />
      </header>

      <div className="flow-body">
        <article className="soft-card is-breathe">
          <BreathBloom />
          <h2>先让呼吸慢下来</h2>
          <p className="font-xl">
            请用户呼吸放平缓，思考最想求解的事务，可以慢慢闭上眼睛，此时让脑海浮现出6位数字。如果出现多位6位数，可以用心念几遍，看看哪个6位数念起来负担更小、更顺口。那么睁开眼睛，录入这6位数字。
          </p>
        </article>

        <article className="soft-card">
          <div className="card-head">
            <h3>录入直觉数字</h3>
            <span>共 6 位</span>
          </div>
          <DigitInput value={digits} onChange={setDigits} boxed />
          <p className="hint">请依照当下直觉输入，不必填写生日或他人信息。</p>
        </article>

        {err ? <p className="err pad-x">{err}</p> : null}
      </div>

      <div className="flow-dock">
        <button className="btn-cinnabar is-block" disabled={!ready || busy} onClick={submit}>
          {busy ? "演算中" : "开始分析"}
        </button>
      </div>
    </section>
  );
}
