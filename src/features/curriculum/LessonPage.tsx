import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ROUTES, type LessonProgress, type ToolkitKind } from "../../domain";
import { useApp } from "../../app/AppContext";
import { Button } from "../../components/Button";
import { Card, CardHeader } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { Field, Textarea } from "../../components/Form";
import { Icon } from "../../components/Icon";
import { PageHeader } from "../../components/PageHeader";
import { InlineStatus } from "../../components/Status";
import { useBusyAction } from "../../hooks/useBusyAction";

const saveKind: Record<string, ToolkitKind | undefined> = {
  cue: "cue",
  routine: "routine",
  imagery: "imagery",
  if_then: "if_then",
};

export function LessonPage() {
  const { lessonId } = useParams();
  const { session, bundle, gateway, refresh, announce } = useApp();
  const navigate = useNavigate();
  const { busy, localError, run } = useBusyAction();
  const lesson = bundle?.curriculum.find((item) => item.id === lessonId);
  const existing = bundle?.lessonProgress.find((item) => item.lessonId === lessonId);
  const [output, setOutput] = useState(existing?.outputText ?? "");
  const [used, setUsed] = useState(existing?.status === "applied" || existing?.status === "completed");
  const [step, setStep] = useState<"learn" | "try" | "reflect">(existing?.status === "completed" ? "reflect" : "learn");
  const needsOutput = useMemo(() => lesson?.saveTarget && lesson.saveTarget !== "none", [lesson]);
  if (!session || !bundle || !lesson) return <Navigate to={ROUTES.curriculum} replace />;

  const save = async (status: LessonProgress["status"]) => {
    const progress = await run(() => gateway.saveLessonProgress(session, {
      id: existing?.id,
      lessonId: lesson.id,
      status,
      outputText: output.trim() || undefined,
      outputType: lesson.saveTarget ?? "none",
      appliedToSessionId: status !== "started" ? bundle.currentSession?.id : undefined,
    }));
    if (!progress) return;
    if (status === "completed" && output.trim()) {
      if (lesson.saveTarget === "evidence") {
        await gateway.saveEvidence(session, { text: output.trim(), source: "lesson", contextLabel: lesson.title, tags: [lesson.skillKey, "lesson"] });
      } else if (lesson.saveTarget === "goal") {
        await gateway.saveGoal(session, { text: output.trim(), level: "weekly", evidenceDefinition: "I can show this behavior in practice." });
      } else if (saveKind[lesson.saveTarget ?? ""]) {
        await gateway.saveToolkitItem(session, { kind: saveKind[lesson.saveTarget ?? ""]!, title: lesson.title, text: output.trim(), sourceRef: { kind: "lesson", id: lesson.id }, tags: [lesson.skillKey] });
      }
    }
    await refresh({ quiet: true });
    announce(status === "completed" ? "Skill added to My Wrestling." : "Lesson saved. Use it in the room.");
    if (status === "completed") navigate(ROUTES.curriculum);
  };

  return (
    <div className="page page--lesson">
      <PageHeader back eyebrow={`YOU University · Week ${lesson.week}`} title={lesson.title} />
      <div className="lesson-tabs" role="tablist">
        {(["learn", "try", "reflect"] as const).map((value) => <button type="button" role="tab" aria-selected={step === value} className={step === value ? "is-active" : ""} key={value} onClick={() => setStep(value)}>{value === "learn" ? "Learn" : value === "try" ? "Try it" : "Keep it"}</button>)}
      </div>
      {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}

      {step === "learn" ? (
        <>
          <Card tone="blue" className="lesson-main-card">
            <div className="eyebrow">Why it matters</div>
            <p>{lesson.whyItMatters}</p>
          </Card>
          <Card>
            <CardHeader eyebrow="What it can look like" title="Wrestling examples" />
            <div className="example-stack">{lesson.examples.map((example) => <div key={example}><Icon name="check" size={18}/><span>{example}</span></div>)}</div>
          </Card>
          <Button full size="lg" onClick={() => { setStep("try"); void save("started"); }} iconAfter="arrow">Try the skill</Button>
        </>
      ) : null}

      {step === "try" ? (
        <>
          <Card tone="dark" className="try-card">
            <div className="try-card__icon"><Icon name={lesson.tryItNow.kind === "reset_sweep" ? "eye" : lesson.tryItNow.kind === "imagery" ? "spark" : "target"} size={28}/></div>
            <div className="eyebrow eyebrow--light">Try it now</div>
            <h2>{lesson.tryItNow.title}</h2>
            <ol>{lesson.tryItNow.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>
            {lesson.tryItNow.kind === "reset_sweep" ? <Button full variant="secondary" onClick={() => navigate(ROUTES.resetSweep, { state: { returnTo: ROUTES.lesson(lesson.id) } })} icon="eye">Open Reset Sweep</Button> : null}
          </Card>
          <Card>
            <CardHeader eyebrow="Use it today" title="Transfer it to wrestling" />
            <p className="large-copy">{lesson.useItToday}</p>
            <button type="button" className={`application-toggle ${used ? "is-selected" : ""}`} onClick={() => setUsed((value) => !value)}><span><Icon name={used ? "check" : "plus"}/></span><strong>{used ? "I used or planned this" : "Mark ready to use"}</strong></button>
          </Card>
          <Button full size="lg" onClick={() => { void save("applied"); setStep("reflect"); }} disabled={!used} iconAfter="arrow">Reflect and keep it</Button>
        </>
      ) : null}

      {step === "reflect" ? (
        <>
          <Card>
            <Field label={lesson.reflectPrompt} hint={needsOutput ? "Write one short answer you will actually use." : "A short, honest answer is enough."}>
              <Textarea rows={4} value={output} onChange={(event) => setOutput(event.target.value)} maxLength={320} placeholder="What happened, or what will you use?" />
            </Field>
            {lesson.saveTarget && lesson.saveTarget !== "none" ? <div className="save-destination"><Icon name={lesson.saveTarget === "evidence" ? "heart" : lesson.saveTarget === "goal" ? "target" : "spark"}/><span>This can be saved directly to {lesson.saveTarget === "evidence" ? "your Confidence Bank" : lesson.saveTarget === "goal" ? "your goals" : "My Wrestling"}.</span></div> : null}
          </Card>
          <Button full size="lg" onClick={() => void save("completed")} loading={busy} disabled={Boolean(needsOutput && !output.trim())} iconAfter="check">Complete and keep the skill</Button>
          <button type="button" className="text-button centered" onClick={() => navigate(ROUTES.curriculum)}>Finish later</button>
        </>
      ) : null}
    </div>
  );
}
