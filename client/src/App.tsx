import { useEffect, useState, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { api, type User } from "./lib/api";
import { AuthContext, useAuth } from "./lib/auth";
import { AccountPage } from "./pages/Account";
import { AdminPage } from "./pages/Admin";
import { HistoryPage } from "./pages/History";
import { HubPage } from "./pages/Hub";
import { LegalPage } from "./pages/Legal";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
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
  const location = useLocation();
  const { user, loading } = useAuth();
  if (loading) return <p className="muted">展卷中…</p>;
  if (!user) {
    return <Navigate to="/login" state={{ next: `${location.pathname}${location.search}` }} replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Gate>
        <Routes>
          <Route path="/" element={<HubPage />} />
          <Route path="/app" element={<Navigate to="/" replace />} />
          <Route path="/app/plum" element={<Navigate to="/apps/plum" replace />} />
          <Route path="/app/decision" element={<Navigate to="/apps/decision" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/apps/plum"
            element={
              <NeedUser>
                <PlumPage />
              </NeedUser>
            }
          />
          <Route
            path="/apps/decision"
            element={
              <NeedUser>
                <DecisionPage />
              </NeedUser>
            }
          />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Gate>
    </BrowserRouter>
  );
}
