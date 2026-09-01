import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { PILLARS, ROUTES } from "../../domain";
import { useApp } from "../../app/AppContext";
import { BrandMark } from "../../components/BrandMark";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { ProgressBar } from "../../components/Progress";
import { useBusyAction } from "../../hooks/useBusyAction";

const steps = [
  { title: "One job at a time", text: "Before practice, choose one clear 1% focus you can actually use on the mat.", icon: "target" as const },
  { title: "The room can reinforce it", text: "Only your name, 1% focus, and optional Pillar appear on the Practice Board. Private ratings and reflections stay private.", icon: "users" as const },
  { title: "Keep real proof", text: "Save moments that show preparation, progress, response, or coach recognition. Your Confidence Bank gives that proof back when it matters.", icon: "heart" as const },
  { title: "Learn what works for you", text: "By the end of the season, My Wrestling becomes your personal performance manual.", icon: "spark" as const },
];

export function OnboardingPage() {
  const { session, completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { busy, run } = useBusyAction();
  if (!session) return null;
  if (session.profile.onboardingComplete) return <Navigate to={ROUTES.today} replace />;
  const current = steps[step]!;
  const finish = async () => {
    const done = await run(completeOnboarding);
    if (done !== undefined) navigate(ROUTES.today, { replace: true });
  };
  return (
    <main className="onboarding-page">
      <div className="onboarding-top"><BrandMark compact/><ProgressBar value={step + 1} max={steps.length}/></div>
      <section className="onboarding-card">
        <div className="onboarding-icon"><Icon name={current.icon} size={34}/></div>
        <div className="eyebrow">Step {step + 1} of {steps.length}</div>
        <h1>{current.title}</h1>
        <p>{current.text}</p>
        {step === 0 ? <div className="pillar-strip">{PILLARS.map((pillar) => <span key={pillar.key}>{pillar.label}</span>)}</div> : null}
      </section>
      <div className="onboarding-actions">
        {step > 0 ? <Button variant="ghost" onClick={() => setStep((value) => value - 1)}>Back</Button> : <span/>}
        {step < steps.length - 1 ? <Button iconAfter="arrow" onClick={() => setStep((value) => value + 1)}>Continue</Button> : <Button iconAfter="check" onClick={() => void finish()} loading={busy}>Start building</Button>}
      </div>
    </main>
  );
}
