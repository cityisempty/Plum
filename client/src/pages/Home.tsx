import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DigitInput } from "../components/DigitInput";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export function HomePage() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [broke, setBroke] = useState(false);

  async function submit() {
    setErr("");
    setBroke(false);
    if (digits.length !== 6) {
      setErr("请输入完整六位数字");
      return;
    }
    if (!user) {
      nav("/login", { state: { next: "/", pending: digits } });
      return;
    }
    setBusy(true);
    try {
      const out = await api.divine(digits);
      setUser({ ...user, points: out.pointsRemaining });
      nav(`/result/${out.id}`, { state: { result: out } });
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 402) {
        setBroke(true);
        setErr("余点不足。请至账户页或请管理员添点。");
      } else {
        setErr(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ textAlign: "center", paddingTop: 24 }}>
      <p className="faint" style={{ letterSpacing: "0.42em", fontSize: 13, marginBottom: 36 }}>
        请输入六位之数
      </p>
      <DigitInput value={digits} onChange={setDigits} />
      <div style={{ marginTop: 40 }}>
        <button className={"btn-cinnabar" + (broke ? " is-broke" : "")} disabled={busy} onClick={submit}>
          {busy ? "演算中" : "起 · 卦"}
        </button>
      </div>
      {err ? <p className="err">{err}</p> : null}
      <p className="disclaimer">
        本服务仅供文化研究与娱乐，不构成医疗、投资、婚恋等任何决策建议。
        <br />
        每次完整推算消耗一点。
      </p>
      <style>{`
        .is-broke { animation: crack 0.45s ease; }
        @keyframes crack {
          0% { transform: translateX(0); }
          20% { transform: translateX(-4px) rotate(-1deg); }
          40% { transform: translateX(5px) rotate(1deg); }
          100% { transform: none; }
        }
      `}</style>
    </section>
  );
}
