import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { DEFAULT_FIVE_CS, ROUTES, type FiveCsRatings, type Pillar } from "../../domain";
import { useApp } from "../../app/AppContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ExamplePicker } from "../../components/ExamplePicker";
import { Field, Textarea } from "../../components/Form";
import { FiveCsEditor } from "../../components/FiveCsEditor";
import { PageHeader } from "../../components/PageHeader";
import { PillarPicker } from "../../components/PillarPicker";
import { InlineStatus } from "../../components/Status";
import { useBusyAction } from "../../hooks/useBusyAction";

export function BeforePracticePage() {
  const { session, bundle, gateway, refresh, announce } = useApp();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { busy, localError, run } = useBusyAction();
  const practice = bundle?.currentSession?.id === sessionId ? bundle.currentSession : bundle?.currentSession;
  const bucket = (key: string) => bundle?.exampleBuckets.find((item) => item.key === key);
  const [focus, setFocus] = useState(bundle?.currentCheckin?.before.focusText ?? "");
  const [focusSource, setFocusSource] = useState<"example" | "own">(bundle?.currentCheckin?.before.focusSource === "own" ? "own" : "example");
  const [pillar, setPillar] = useState<Pillar | undefined>(bundle?.currentCheckin?.before.pillar);
  const [showUp, setShowUp] = useState(bundle?.currentCheckin?.before.showUpText ?? "");
  const [fiveCs, setFiveCs] = useState<FiveCsRatings>({ ...DEFAULT_FIVE_CS, ...bundle?.currentCheckin?.before.fiveCs });
  const [showFiveCs, setShowFiveCs] = useState(Boolean(bundle?.currentCheckin?.before.fiveCs));
  const [resetUsed, setResetUsed] = useState<"breathing" | "reset_sweep" | "none">(bundle?.currentCheckin?.before.resetUsed ?? "none");
  const focusError = useMemo(() => focus.trim().length < 3 ? "Choose or write one clear job." : focus.trim().length > 80 ? "Keep it under 80 characters so you can remember it." : "", [focus]);

  if (!session || !bundle || !practice) return <Navigate to={ROUTES.today} replace />;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (focusError) return;
    const result = await run(() => gateway.saveBeforePractice({
      session,
      practiceSession: practice,
      data: {
        focusText: focus.trim(),
        focusSource,
        pillar,
        showUpText: showUp.trim() || undefined,
        fiveCs: showFiveCs ? fiveCs : undefined,
        resetUsed,
      },
    }));
    if (!result) return;
    await refresh({ quiet: true });
    announce("Your 1% is on the Practice Board.");
    navigate(ROUTES.today, { replace: true });
  };

  return (
    <div className="page page--flow">
      <PageHeader back eyebrow="Before practice" title="Choose one job" description="Keep it clear enough that a coach can call it out and you can use it during a rep." />
      <form className="flow-form" onSubmit={submit}>
        {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
        <Card className="focus-builder-card">
          <Field label="What's your 1% today?" hint={bucket("practice_focus")?.why} error={focus && focusError ? focusError : undefined}>
            <ExamplePicker examples={bucket("practice_focus")?.examples ?? []} value={focus} onChange={(value, source) => { setFocus(value); setFocusSource(source); }} placeholder="My own clear focus" />
          </Field>
          <div className="character-count">{focus.length}/80</div>
        </Card>

        <Card>
          <Field label="Choose a Pillar" hint="Optional. Pick the behavior you want to show today.">
            <PillarPicker value={pillar} onChange={setPillar} />
          </Field>
        </Card>

        <Card>
          <Field label="How will you show up?" hint="Choose an example or write your own.">
            <ExamplePicker examples={bucket("show_up")?.examples ?? []} value={showUp} onChange={(value) => setShowUp(value)} placeholder="How I will enter the room" />
          </Field>
        </Card>

        <Card className="reset-choice-card">
          <h2>Need a reset first?</h2>
          <p>You can use one now, or skip it and get to practice.</p>
          <div className="choice-grid">
            <button type="button" className={resetUsed === "breathing" ? "is-selected" : ""} onClick={() => setResetUsed(resetUsed === "breathing" ? "none" : "breathing")}><strong>4-4-4-4 breathing</strong><span>Persistent · Consistent · Resilient · Relentless</span></button>
            <button type="button" className={resetUsed === "reset_sweep" ? "is-selected" : ""} onClick={() => { setResetUsed("reset_sweep"); navigate(ROUTES.resetSweep, { state: { returnTo: ROUTES.beforePractice(practice.id) } }); }}><strong>Reset Sweep</strong><span>Short visual focus, then your next job</span></button>
          </div>
        </Card>

        <details className="details-card" open={showFiveCs} onToggle={(event) => setShowFiveCs((event.currentTarget as HTMLDetailsElement).open)}>
          <summary><span><strong>Check your Five Cs</strong><small>Optional self-awareness, never a grade</small></span></summary>
          <FiveCsEditor value={fiveCs} onChange={setFiveCs} />
        </details>

        <div className="sticky-submit">
          <Button full size="lg" type="submit" loading={busy} disabled={Boolean(focusError)} iconAfter="arrow">Put my 1% on the board</Button>
          <p>Team visible: your first name, 1% focus, and optional Pillar only.</p>
        </div>
      </form>
    </div>
  );
}
