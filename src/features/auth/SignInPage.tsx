import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { DEMO_ACCOUNTS, ROUTES, type Role } from "../../domain";
import { useApp } from "../../app/AppContext";
import { BrandMark } from "../../components/BrandMark";
import { Button } from "../../components/Button";
import { Field, Input } from "../../components/Form";
import { InlineStatus } from "../../components/Status";
import { useBusyAction } from "../../hooks/useBusyAction";

export function SignInPage() {
  const { session, gateway, signInEmail, signInGoogle, signInDemo } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { busy, localError, run } = useBusyAction();
  if (session) return <Navigate to={session.membership.role === "athlete" ? ROUTES.today : ROUTES.coach} replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void run(() => signInEmail(email, password));
  };

  return (
    <main className="sign-in-page">
      <section className="sign-in-hero">
        <div className="sign-in-hero__glow" />
        <BrandMark className="sign-in-logo" />
        <div className="sign-in-hero__copy">
          <div className="eyebrow eyebrow--light">Merrill Girls Wrestling</div>
          <h1>Build your wrestling.</h1>
          <p>One clear job. One useful reset. Real proof of what you can do.</p>
        </div>
        <div className="sign-in-pillars"><span>Persistent</span><span>Consistent</span><span>Resilient</span><span>Relentless</span></div>
      </section>

      <section className="sign-in-panel">
        <div className="sign-in-panel__inner">
          <h2>Welcome back</h2>
          <p className="muted">Sign in with the account approved for your team.</p>
          {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
          {gateway.mode === "firebase" ? (
            <>
              <Button full size="lg" variant="dark" onClick={() => void run(signInGoogle)} loading={busy}>Continue with Google</Button>
              <div className="divider"><span>or use email</span></div>
            </>
          ) : null}
          <form className="stack" onSubmit={submit}>
            <Field label="Email"><Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" /></Field>
            <Field label="Password"><Input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} /></Field>
            <Button full size="lg" type="submit" loading={busy}>Sign in</Button>
          </form>

          {gateway.mode === "demo" ? (
            <div className="demo-access">
              <div className="divider"><span>preview the complete app</span></div>
              <div className="demo-grid">
                {DEMO_ACCOUNTS.map((account) => (
                  <button key={account.role} type="button" onClick={() => void run(() => signInDemo(account.role as Role))}>
                    <strong>{account.label}</strong><span>{account.role === "athlete" ? "Daily athlete experience" : account.role === "coach" ? "Practice and recognition" : account.role === "admin" ? "Roster and content control" : "Wrestling-room display"}</span>
                  </button>
                ))}
              </div>
              <p className="demo-note">Demo email password: <strong>demo1234</strong></p>
            </div>
          ) : null}
          <p className="privacy-note">This is a closed team system. Your private reflections never appear on the Practice Board.</p>
        </div>
      </section>
    </main>
  );
}
