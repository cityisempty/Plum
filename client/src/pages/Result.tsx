import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { NatureSigil } from "../components/NatureSigil";
import { api, type DivinePayload } from "../lib/api";

export function ResultPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { result?: DivinePayload } };
  const [data, setData] = useState<DivinePayload | null>(loc.state?.result ?? null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (data || !id) return;
    api
      .record(id)
      .then((row) => setData(row))
      .catch((e) => setErr((e as Error).message));
  }, [id, data]);

  if (err) return <p className="err">{err}</p>;
  if (!data) return <p className="muted">展卷中…</p>;

  const interp = data.interpretation;
  const digits = data.input.split("");

  return (
    <section className="flow is-result">
      <header className="flow-bar">
        <Link to="/apps/plum" className="flow-back" aria-label="返回">
          ‹
        </Link>
        <h1>数字投射解码</h1>
        <span />
      </header>

      <p className="digit-caption">本次直觉数字</p>
      <div className="digit-row">
        {digits.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <article className="result-card">
        <div className="sigil-display" aria-label="抽象物象">
          <NatureSigil nature={data.upperNature} />
        </div>
        <h2>{interp.title}</h2>
        <p className="result-code">编码：{data.code}</p>
        <p className="result-summary">{interp.summary || interp.title}</p>
        {interp.missing ? (
          <p className="muted">此爻释义待录入。</p>
        ) : (
          <button className="btn-outline" type="button" onClick={() => setOpen(true)}>
            查看详情
          </button>
        )}
      </article>

      <button className="text-link" type="button" onClick={() => nav("/apps/plum")}>
        重新输入
      </button>

      {open ? (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label="投射详情"
          onClick={() => setOpen(false)}
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>投射详情</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="关闭">
                ×
              </button>
            </header>
            <div className="sheet-body">
              <h4>一、心理投射解读</h4>
              <p>{interp.psychology}</p>
              <h4>二、人群差异化提示</h4>
              <p>{interp.audience}</p>
              <h4>三、物象觉察</h4>
              <p>{interp.imagery}</p>
              <p className="disclaimer">本服务仅供文化研究与娱乐，不构成医疗、投资、婚恋等任何决策建议。</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
