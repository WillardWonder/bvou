import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PILLARS, ROUTES } from "../../domain";
import { Button } from "../../components/Button";
import { Chip } from "../../components/Chip";
import { Icon } from "../../components/Icon";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export function ResetSweepPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? ROUTES.today;
  const [duration, setDuration] = useState<20 | 30 | 45>(30);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(duration);
  const [complete, setComplete] = useState(false);
  const [nonVisual, setNonVisual] = useState(reducedMotion);
  const timer = useRef<number | null>(null);
  const progress = useMemo(() => ((duration - remaining) / duration) * 100, [duration, remaining]);

  useEffect(() => {
    setRemaining(duration);
    setComplete(false);
    setRunning(false);
  }, [duration, nonVisual]);

  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const initial = remaining;
    timer.current = window.setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const next = Math.max(0, initial - elapsed);
      setRemaining(next);
      if (next <= 0) {
        if (timer.current) window.clearInterval(timer.current);
        setRunning(false);
        setComplete(true);
      }
    }, 100);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [running]);

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    setRunning(false);
  };

  return (
    <main className={`reset-page ${running ? "is-running" : ""}`}>
      <header className="reset-header">
        <button type="button" className="icon-button icon-button--light" aria-label="Close reset" onClick={() => navigate(returnTo)}><Icon name="close" /></button>
        <span>Reset Sweep</span>
        <button type="button" className="text-button text-button--light" onClick={() => navigate(returnTo)}>Skip</button>
      </header>

      <section className="reset-stage">
        <div className="reset-stage__copy">
          <div className="eyebrow eyebrow--light">Easy eyes. Easy breath.</div>
          <h1>{complete ? "What is your next job?" : nonVisual ? "Breathe through the four Pillars" : "Follow the dot, then move on."}</h1>
          <p>{complete ? "Choose one short cue and return to wrestling." : "Stop at any time. This is a brief performance-focus tool, not therapy."}</p>
        </div>

        {!nonVisual ? (
          <div className={`sweep-track ${running ? "is-moving" : ""}`} style={{ "--sweep-duration": `${Math.max(2.8, duration / 7)}s` } as React.CSSProperties}>
            <span className="sweep-track__line" />
            <span className="sweep-dot" />
          </div>
        ) : (
          <div className={`breath-orb ${running ? "is-breathing" : ""}`}>
            <span>{PILLARS[Math.floor((progress / 100) * PILLARS.length) % PILLARS.length]?.label ?? "Persistent"}</span>
          </div>
        )}

        <div className="reset-progress"><span style={{ width: `${progress}%` }} /></div>
        <div className="reset-timer">{Math.ceil(remaining)}s</div>

        {complete ? (
          <div className="reset-complete">
            <div className="chip-list chip-list--center"><Chip>Next exchange</Chip><Chip>One job</Chip><Chip>Good stance</Chip><Chip>Breathe</Chip></div>
            <Button full size="lg" onClick={() => navigate(returnTo)} iconAfter="arrow">Return to my next job</Button>
          </div>
        ) : (
          <div className="reset-controls">
            <div className="chip-list chip-list--center">{([20, 30, 45] as const).map((seconds) => <Chip key={seconds} selected={duration === seconds} disabled={running} onClick={() => setDuration(seconds)}>{seconds}s</Chip>)}</div>
            <Button full size="lg" variant={running ? "danger" : "primary"} icon={running ? "pause" : "play"} onClick={() => running ? stop() : setRunning(true)}>{running ? "Stop" : remaining < duration ? "Continue" : "Start"}</Button>
            <button className="reset-alternative" type="button" disabled={running} onClick={() => setNonVisual((value) => !value)}>{nonVisual ? "Use visual sweep" : "Use breathing instead"}</button>
          </div>
        )}
      </section>
    </main>
  );
}
