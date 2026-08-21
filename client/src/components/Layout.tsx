import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

export function Layout({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const inApp = loc.pathname.startsWith("/apps/");

  // Decision is a full-viewport app with its own shell and background. Do not
  // place it inside the paper shell used by the account and Plum pages.
  if (loc.pathname.startsWith("/apps/decision")) {
    return <>{children}</>;
  }

  return (
    <div className="paper-root">
      <div className={"shell" + (inApp ? " is-app" : "")}>
        <main className="page-enter">{children}</main>
      </div>
    </div>
  );
}
