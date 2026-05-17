import AppNav from "./app-nav";
import SiteFooter from "./site-footer";

export default function AppShell({ children }) {
  return (
    <main className="page-shell">
      <div className="page-frame">
        <AppNav />
        {children}
        <SiteFooter />
      </div>
    </main>
  );
}
