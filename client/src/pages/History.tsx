import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type HistoryItem } from "../lib/api";

export function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .history()
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((e) => setErr((e as Error).message));
  }, []);

  if (err) return <p className="err">{err}</p>;

  return (
    <section>
      <Link to="/" className="page-back">← 返回首页</Link>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "0.28em" }}>历史记录</h2>
      <p className="muted" style={{ fontSize: 13 }}>
        共 {total} 笺
      </p>
      {items.length === 0 ? <p className="faint">尚无推算。</p> : null}
      {items.map((it) => (
        <Link key={it.id} to={`/apps/plum/result/${it.id}`} className="history-item">
          <span className="code">{it.code}</span>
          <span>
            <strong style={{ fontWeight: 500 }}>{it.hexagramName}</strong>
            <span className="muted"> · {it.movingName}</span>
            <div className="faint" style={{ fontSize: 13, marginTop: 4 }}>
              {it.title}
            </div>
          </span>
          <span className="faint" style={{ fontSize: 12 }}>
            {it.input}
          </span>
        </Link>
      ))}
    </section>
  );
}
