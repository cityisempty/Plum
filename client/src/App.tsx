import { useEffect, useState, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { api, type User } from "./lib/api";
import { AuthContext } from "./lib/auth";
import { AccountPage } from "./pages/Account";
import { AdminPage } from "./pages/Admin";
import { HistoryPage } from "./pages/History";
import { HubPage } from "./pages/Hub";
import { LegalPage } from "./pages/Legal";
import { LoginPage } from "./pages/Login";
import { PlumPage } from "./pages/Plum";
import { ResultPage } from "./pages/Result";
import { DecisionPage } from "./pages/Decision";

function Gate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const r = await api.me();
      setUser(r.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, setUser }}>
      <Layout>{children}</Layout>
    </AuthContext.Provider>
  );
}

function NeedUser({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Consumer>
      {(ctx) => {
        if (ctx.loading) return <p className="muted">展卷中…</p>;
        if (!ctx.user) return <Navigate to="/login" replace />;
        return <>{children}</>;
      }}
    </AuthContext.Consumer>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Gate>
        <Routes>
          <Route path="/" element={<HubPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/apps/plum" element={<PlumPage />} />
          <Route path="/apps/decision" element={<DecisionPage />} />
          <Route
            path="/apps/plum/result/:id"
            element={
              <NeedUser>
                <ResultPage />
              </NeedUser>
            }
          />
          <Route path="/result/:id" element={<Navigate to="/" replace />} />
          <Route
            path="/history"
            element={
              <NeedUser>
                <HistoryPage />
              </NeedUser>
            }
          />
          <Route
            path="/account"
            element={
              <NeedUser>
                <AccountPage />
              </NeedUser>
            }
          />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/terms" element={<LegalPage kind="terms" />} />
          <Route path="/privacy" element={<LegalPage kind="privacy" />} />
          <Route path="/disclaimer" element={<LegalPage kind="disclaimer" />} />
        </Routes>
      </Gate>
    </BrowserRouter>
  );
}
