import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../domain";
import { useApp } from "../app/AppContext";
import { BrandMark } from "./BrandMark";
import { Icon, type IconName } from "./Icon";

const athleteNav: Array<{ to: string; label: string; icon: IconName }> = [
  { to: ROUTES.today, label: "Today", icon: "home" },
  { to: ROUTES.develop, label: "Develop", icon: "spark" },
  { to: ROUTES.compete, label: "Compete", icon: "trophy" },
  { to: ROUTES.team, label: "Team", icon: "team" },
];

export function AppShell() {
  const { session, online, signOut, gateway } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isCoach = session && ["coach", "admin"].includes(session.membership.role);
  const boardLike = location.pathname.startsWith("/board/");
  if (boardLike) return <Outlet />;

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button type="button" className="app-topbar__brand" onClick={() => navigate(isCoach ? ROUTES.coach : ROUTES.today)} aria-label="Go to home">
          <BrandMark compact />
          <span><strong>Merrill</strong><small>Girls Wrestling</small></span>
        </button>
        <div className="app-topbar__right">
          {!online ? <span className="connection-pill"><Icon name="wifiOff" size={15}/> Offline</span> : null}
          {gateway.mode === "demo" ? <span className="mode-pill">Demo</span> : null}
          <button type="button" className="profile-button" onClick={() => navigate(isCoach ? ROUTES.coachAdmin : ROUTES.develop)} aria-label="Open profile and settings">
            <span>{session?.displayName?.charAt(0) || "M"}</span>
          </button>
        </div>
      </header>

      {!online ? <div className="offline-bar">Your work can continue. Changes will sync when this device reconnects.</div> : null}
      <main className="app-main"><Outlet /></main>

      {isCoach ? (
        <nav className="coach-bottom-nav" aria-label="Coach navigation">
          <NavLink to={ROUTES.coach} end><Icon name="coach"/><span>Coach</span></NavLink>
          <NavLink to={ROUTES.coachContent}><Icon name="book"/><span>Content</span></NavLink>
          <NavLink to={ROUTES.coachAdmin}><Icon name="settings"/><span>Admin</span></NavLink>
          <button type="button" onClick={() => void signOut()}><Icon name="logout"/><span>Sign out</span></button>
        </nav>
      ) : (
        <nav className="bottom-nav" aria-label="Main navigation">
          {athleteNav.map((item) => <NavLink key={item.to} to={item.to}><Icon name={item.icon}/><span>{item.label}</span></NavLink>)}
        </nav>
      )}
    </div>
  );
}
