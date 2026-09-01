import { useMemo, useState, type FormEvent } from "react";
import { buildWeeklyRecap, summarizeEvidenceThemes, type Goal, type ToolkitKind } from "../../domain";
import { useApp } from "../../app/AppContext";
import { Button } from "../../components/Button";
import { Card, CardHeader } from "../../components/Card";
import { Tag } from "../../components/Chip";
import { EvidenceCard } from "../../components/EvidenceCard";
import { Field, Input, Select, Textarea } from "../../components/Form";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { ProgressBar } from "../../components/Progress";
import { InlineStatus } from "../../components/Status";
import { formatDate } from "../../utils/date";
import { useBusyAction } from "../../hooks/useBusyAction";

export function DevelopmentPage() {
  const { session, bundle, gateway, refresh, announce } = useApp();
  const [goalModal, setGoalModal] = useState(false);
  const [toolModal, setToolModal] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [goalLevel, setGoalLevel] = useState<Goal["level"]>("weekly");
  const [goalEvidence, setGoalEvidence] = useState("");
  const [toolKind, setToolKind] = useState<ToolkitKind>("what_works");
  const [toolTitle, setToolTitle] = useState("What works for me");
  const [toolText, setToolText] = useState("");
  const { busy, localError, run } = useBusyAction();
  if (!session || !bundle) return null;
  const currentLesson = bundle.curriculum.find((lesson) => lesson.id === bundle.currentSession?.curriculumLessonId);
  const recap = buildWeeklyRecap(bundle.checkins, bundle.evidence, new Date(), currentLesson?.title);
  const themes = summarizeEvidenceThemes(bundle.evidence);
  const activeGoals = bundle.goals.filter((item) => item.status === "active").sort((a, b) => ["season", "performance", "block", "weekly", "daily"].indexOf(a.level) - ["season", "performance", "block", "weekly", "daily"].indexOf(b.level));
  const completedSkills = new Set(bundle.lessonProgress.filter((item) => item.status === "completed").map((item) => item.lessonId)).size;
  const ownRatio = recap.ownLanguageRatio ? Math.round(recap.ownLanguageRatio * 100) : 0;
  const whatWorks = bundle.toolkit.filter((item) => item.kind === "what_works" && item.active);
  const cues = bundle.toolkit.filter((item) => item.kind === "cue" && item.active);
  const routines = bundle.toolkit.filter((item) => item.kind === "routine" && item.active);
  const pinned = bundle.evidence.filter((item) => item.pinned && !item.archived).slice(0, 3);

  const addGoal = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() => gateway.saveGoal(session, { text: goalText, level: goalLevel, evidenceDefinition: goalEvidence || undefined }));
    if (!result) return;
    await refresh({ quiet: true }); setGoalModal(false); setGoalText(""); setGoalEvidence(""); announce("Goal saved. Make the next daily action small and visible.");
  };
  const addTool = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() => gateway.saveToolkitItem(session, { kind: toolKind, title: toolTitle, text: toolText, tags: ["manual"] }));
    if (!result) return;
    await refresh({ quiet: true }); setToolModal(false); setToolText(""); announce("Added to My Wrestling.");
  };

  return (
    <div className="page">
      <PageHeader eyebrow="My Wrestling" title="Learn what works for you" description="This is your season-long performance manual, not a grade." />

      <Card tone="dark" className="identity-card">
        <div className="eyebrow eyebrow--light">My wrestling right now</div>
        <h2>{bundle.currentCheckin?.before.focusText || activeGoals.find((item) => item.level === "weekly")?.text || "Choose one useful focus"}</h2>
        <div className="identity-card__stats">
          <div><strong>{bundle.evidence.filter((item) => !item.archived).length}</strong><span>pieces of proof</span></div>
          <div><strong>{completedSkills}</strong><span>skills learned</span></div>
          <div><strong>{whatWorks.length + cues.length + routines.length}</strong><span>tools kept</span></div>
        </div>
      </Card>

      <Card>
        <CardHeader eyebrow={`${formatDate(recap.weekStart, { month: "short", day: "numeric" })}–${formatDate(recap.weekEnd, { month: "short", day: "numeric" })}`} title="Your week" />
        {recap.focusThemes.length ? <div className="week-focus"><span>You focused most on</span><strong>{recap.focusThemes[0]?.label}</strong></div> : <p className="muted">Your weekly pattern will appear after you close a few practice loops.</p>}
        {recap.lessonTitle ? <div className="summary-line"><span>Skill in the room</span><strong>{recap.lessonTitle}</strong></div> : null}
        <div className="summary-line"><span>Used your own language</span><strong>{ownRatio}%</strong></div>
        <ProgressBar value={ownRatio} label="Scaffolding independence" />
        {recap.evidence[0] ? <div className="weekly-proof"><small>Something you proved</small><EvidenceCard item={recap.evidence[0]} compact /></div> : null}
      </Card>

      <Card>
        <CardHeader eyebrow="Goal ladder" title="Direction → next action" action={<button className="icon-button icon-button--small" type="button" onClick={() => setGoalModal(true)} aria-label="Add goal"><Icon name="plus" size={18}/></button>} />
        {activeGoals.length ? <div className="goal-ladder">{activeGoals.map((goal, index) => <div className="goal-row" key={goal.id}><span className="goal-row__level">{goal.level}</span><div><strong>{goal.text}</strong>{goal.evidenceDefinition ? <small>Proof: {goal.evidenceDefinition}</small> : null}</div>{index < activeGoals.length - 1 ? <span className="goal-row__line" /> : null}</div>)}</div> : <button className="add-empty" type="button" onClick={() => setGoalModal(true)}><Icon name="target"/><span><strong>Add a goal ladder</strong><small>Connect season direction to a weekly behavior.</small></span></button>}
      </Card>

      <Card>
        <CardHeader eyebrow="My toolkit" title="Things I know how to use" action={<button className="icon-button icon-button--small" type="button" onClick={() => setToolModal(true)} aria-label="Add to toolkit"><Icon name="plus" size={18}/></button>} />
        <div className="toolkit-grid">
          <ToolkitBlock title="Best cues" icon="target" items={cues.map((item) => item.text)} />
          <ToolkitBlock title="What gets me ready" icon="play" items={routines.map((item) => item.text)} />
          <ToolkitBlock title="What works for me" icon="spark" items={whatWorks.map((item) => item.text)} />
        </div>
      </Card>

      {pinned.length ? <Card tone="blue"><CardHeader eyebrow="Pinned proof" title="Memories I chose to keep" />{pinned.map((item) => <EvidenceCard key={item.id} item={item} compact />)}</Card> : null}

      {themes.length ? <Card><CardHeader eyebrow="Patterns, not scores" title="What your proof is showing" /><div className="theme-cloud">{themes.map((theme) => <Tag tone={theme.count >= 3 ? "blue" : "default"} key={theme.label}>{theme.label} · {theme.count}</Tag>)}</div></Card> : null}

      <Card className="terms-card"><CardHeader eyebrow="Merrill language" title="Words this room actually uses" /><div className="term-list">{bundle.terms.slice(0, 12).map((term) => <div key={term.id}><strong>{term.term}</strong>{term.definition ? <span>{term.definition}</span> : null}</div>)}</div><p className="fine-print">Only coach-approved active terms appear here. Legacy terms stay hidden until verified.</p></Card>

      <Modal open={goalModal} onClose={() => setGoalModal(false)} title="Add a useful goal" footer={<><Button variant="ghost" onClick={() => setGoalModal(false)}>Cancel</Button><Button type="submit" form="goal-form" loading={busy}>Save goal</Button></>}>
        {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
        <form id="goal-form" className="stack" onSubmit={addGoal}><Field label="Goal level"><Select value={goalLevel} onChange={(event) => setGoalLevel(event.target.value as Goal["level"])}><option value="season">Season direction</option><option value="performance">Performance capability</option><option value="block">Training block</option><option value="weekly">This week</option><option value="daily">Today</option></Select></Field><Field label="What are you working toward?"><Textarea required rows={3} value={goalText} onChange={(event) => setGoalText(event.target.value)}/></Field><Field label="What would count as proof?" hint="Optional, but make it observable."><Textarea rows={2} value={goalEvidence} onChange={(event) => setGoalEvidence(event.target.value)}/></Field></form>
      </Modal>

      <Modal open={toolModal} onClose={() => setToolModal(false)} title="Add to My Wrestling" footer={<><Button variant="ghost" onClick={() => setToolModal(false)}>Cancel</Button><Button type="submit" form="tool-form" loading={busy}>Keep this</Button></>}>
        {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
        <form id="tool-form" className="stack" onSubmit={addTool}><Field label="Type"><Select value={toolKind} onChange={(event) => { const kind = event.target.value as ToolkitKind; setToolKind(kind); setToolTitle(kind === "cue" ? "My cue" : kind === "routine" ? "My routine" : kind === "reset" ? "My reset" : kind === "if_then" ? "My if-then plan" : "What works for me"); }}><option value="what_works">What works for me</option><option value="cue">Cue</option><option value="routine">Routine</option><option value="reset">Reset</option><option value="imagery">Imagery</option><option value="if_then">If-then plan</option></Select></Field><Field label="Title"><Input value={toolTitle} onChange={(event) => setToolTitle(event.target.value)} required/></Field><Field label="What should future you remember?"><Textarea rows={4} value={toolText} onChange={(event) => setToolText(event.target.value)} required/></Field></form>
      </Modal>
    </div>
  );
}

function ToolkitBlock({ title, icon, items }: { title: string; icon: "target" | "play" | "spark"; items: string[] }) {
  return <section className="toolkit-block"><div className="toolkit-block__title"><Icon name={icon}/><strong>{title}</strong></div>{items.length ? items.slice(0, 3).map((item) => <p key={item}>{item}</p>) : <p className="muted">Nothing saved yet.</p>}</section>;
}
