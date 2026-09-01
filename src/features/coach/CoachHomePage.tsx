import { useMemo, useState, type FormEvent } from "react";
import { ROUTES, type Membership, type Pillar, type PracticeSession } from "../../domain";
import { useApp } from "../../app/AppContext";
import { Button } from "../../components/Button";
import { Card, CardHeader } from "../../components/Card";
import { Chip, Tag } from "../../components/Chip";
import { Field, Input, Select, Textarea } from "../../components/Form";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { PillarPicker } from "../../components/PillarPicker";
import { ProgressBar } from "../../components/Progress";
import { EmptyState, InlineStatus } from "../../components/Status";
import { dateKey, formatDate } from "../../utils/date";
import { useBusyAction } from "../../hooks/useBusyAction";

function focusTheme(text: string): string {
  const value = text.toLowerCase();
  if (/stance|feet|move|lower/.test(value)) return "Stance & movement";
  if (/reset|calm|breathe|mistake/.test(value)) return "Reset & composure";
  if (/tie|contact|hand-fight|setup|set-up/.test(value)) return "Contact & setups";
  if (/stand-up|escape|bottom/.test(value)) return "Bottom work";
  if (/finish|shot|single|attack/.test(value)) return "Attacks & finishes";
  return "Personal focus";
}

export function CoachHomePage() {
  const { session, bundle, gateway, refresh, announce } = useApp();
  const { busy, localError, run } = useBusyAction();
  const [practiceModal, setPracticeModal] = useState(false);
  const [recognitionAthlete, setRecognitionAthlete] = useState<Membership | null>(null);
  const [theme, setTheme] = useState(bundle?.currentSession?.teamTheme ?? "Own the next exchange");
  const [practiceDate, setPracticeDate] = useState(dateKey());
  const [lessonId, setLessonId] = useState(bundle?.currentSession?.curriculumLessonId ?? "");
  const [recognitionText, setRecognitionText] = useState("");
  const [recognitionPillar, setRecognitionPillar] = useState<Pillar | undefined>();
  const [recognitionTags, setRecognitionTags] = useState("");
  if (!session || !bundle) return null;
  const practice = bundle.currentSession;
  const athletes = bundle.memberships.filter((item) => item.role === "athlete" && item.active);
  const boardMap = new Map(bundle.boardEntries.map((entry) => [entry.athleteUid, entry]));
  const ready = bundle.boardEntries.filter((entry) => entry.state === "ready");
  const complete = bundle.boardEntries.filter((entry) => entry.reflectionComplete).length;
  const themes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of ready) counts.set(focusTheme(entry.focusText), (counts.get(focusTheme(entry.focusText)) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [ready]);

  const createPractice = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() => gateway.createPracticeSession(session, {
      dateKey: practiceDate,
      teamTheme: theme,
      curriculumLessonId: lessonId || undefined,
      boardStatus: "open",
      closingPrompt: "What did you get 1% better at?",
    }));
    if (!result) return;
    await refresh({ quiet: true }); setPracticeModal(false); announce("Practice opened. Athlete focuses can now appear on the board.");
  };
  const updateStatus = async (status: PracticeSession["boardStatus"]) => {
    if (!practice) return;
    const result = await run(() => gateway.updatePracticeSession(session, practice.id, { boardStatus: status }));
    if (!result) return;
    await refresh({ quiet: true }); announce(status === "open" ? "Practice Board is open." : status === "closed" ? "Practice Board closed." : "Practice saved as draft.");
  };
  const recognize = async (event: FormEvent) => {
    event.preventDefault();
    if (!recognitionAthlete) return;
    const result = await run(() => gateway.saveCoachRecognition({
      session,
      athleteUid: recognitionAthlete.uid,
      athleteDisplayName: recognitionAthlete.boardDisplayName,
      text: recognitionText,
      pillar: recognitionPillar,
      tags: recognitionTags.split(",").map((tag) => tag.trim()).filter(Boolean),
    }));
    if (!result) return;
    await refresh({ quiet: true }); setRecognitionAthlete(null); setRecognitionText(""); setRecognitionPillar(undefined); setRecognitionTags(""); announce("Coach recognition saved to the athlete's Confidence Bank.");
  };
  const launchBoard = () => {
    if (!practice) return;
    window.open(ROUTES.board(session.teamId, practice.id), "mgw-practice-board", "noopener,noreferrer");
  };

  return (
    <div className="page page--coach">
      <PageHeader eyebrow="Coach Home" title="Run the room, see the focus" description="The board and roster make individualized coaching possible without turning practice into paperwork." action={<button className="icon-button" type="button" onClick={() => setPracticeModal(true)} aria-label="Create practice"><Icon name="plus"/></button>} />

      {!practice ? <EmptyState title="Open today's practice" text="Set the room theme and optional YOU University skill, then athletes can choose a 1% focus." action={<Button onClick={() => setPracticeModal(true)} icon="plus">Create practice</Button>}/> : (
        <Card tone="dark" className="coach-practice-card">
          <div className="coach-practice-card__head"><div><div className="eyebrow eyebrow--light">{formatDate(practice.dateKey)}</div><h2>{practice.teamTheme || "Today's practice"}</h2></div><Tag tone={practice.boardStatus === "open" ? "green" : "dark"}>{practice.boardStatus}</Tag></div>
          <div className="coach-practice-card__metrics"><div><strong>{ready.length}</strong><span>focuses ready</span></div><div><strong>{complete}</strong><span>loops closed</span></div><div><strong>{athletes.length}</strong><span>active athletes</span></div></div>
          <ProgressBar value={ready.length} max={athletes.length || 1} label="Roster ready" />
          <div className="button-row"><Button variant="secondary" onClick={launchBoard} icon="play">Launch Practice Board</Button><Button variant="ghost" onClick={() => void updateStatus(practice.boardStatus === "open" ? "closed" : "open")} icon={practice.boardStatus === "open" ? "pause" : "play"}>{practice.boardStatus === "open" ? "Close board" : "Open board"}</Button></div>
        </Card>
      )}

      {themes.length ? <Card><CardHeader eyebrow="Today's room" title="Common focus themes"/><div className="theme-bars">{themes.map(([label, count]) => <div key={label}><span>{label}</span><div><i style={{ width: `${Math.max(12, (count / ready.length) * 100)}%` }}/></div><strong>{count}</strong></div>)}</div><p className="fine-print">Use this to reinforce themes already chosen by athletes, not to replace individual goals.</p></Card> : null}

      <Card>
        <CardHeader eyebrow="Live roster" title="Who is working on what" action={practice ? <Tag tone="blue">{ready.length}/{athletes.length} ready</Tag> : null} />
        <div className="coach-roster">
          {athletes.map((athlete) => {
            const entry = boardMap.get(athlete.uid);
            return <button type="button" className={`coach-athlete ${entry?.state === "ready" ? "is-ready" : ""}`} key={athlete.uid} onClick={() => { setRecognitionAthlete(athlete); setRecognitionText(entry?.state === "ready" ? `You stayed connected to "${entry.focusText}" when practice got difficult.` : ""); }}>
              <span className="coach-athlete__avatar">{athlete.boardDisplayName.charAt(0)}</span>
              <span className="coach-athlete__copy"><strong>{athlete.boardDisplayName}</strong><small>{entry?.state === "ready" ? entry.focusText : "Focus not set"}</small></span>
              {entry?.pillar ? <Tag tone="blue">{entry.pillar}</Tag> : null}
              {entry?.reflectionComplete ? <span className="complete-check" title="Reflection complete"><Icon name="check" size={16}/></span> : <Icon name="chevron" size={18}/>} 
            </button>;
          })}
        </div>
      </Card>

      {practice?.curriculumLessonId ? (() => { const lesson = bundle.curriculum.find((item) => item.id === practice.curriculumLessonId); return lesson ? <Card tone="blue"><CardHeader eyebrow={`YOU University · Week ${lesson.week}`} title={lesson.title}/><p className="large-copy">{lesson.useItToday}</p><div className="coach-cue"><Icon name="coach"/><span>Coach prompt: Ask what the skill should look like in the next live go.</span></div></Card> : null; })() : null}

      <Card><CardHeader eyebrow="Coach recognition" title="Name the behavior, not just good job"/><p className="large-copy">Observation → program word or skill → why it matters → next reinforcement.</p><div className="recognition-example">“You gave up the first score, reset immediately, and attacked the next exchange. That is Resilient. Keep using the same reset.”</div></Card>

      <Modal open={practiceModal} onClose={() => setPracticeModal(false)} title="Open a practice" footer={<><Button variant="ghost" onClick={() => setPracticeModal(false)}>Cancel</Button><Button type="submit" form="practice-form" loading={busy}>Open practice</Button></>}>
        {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
        <form id="practice-form" className="stack" onSubmit={createPractice}><Field label="Date"><Input type="date" value={practiceDate} onChange={(event) => setPracticeDate(event.target.value)} required/></Field><Field label="Room focus"><Input value={theme} onChange={(event) => setTheme(event.target.value)} maxLength={160} placeholder="Own the next exchange"/></Field><Field label="YOU University skill"><Select value={lessonId} onChange={(event) => setLessonId(event.target.value)}><option value="">No assigned lesson</option>{bundle.curriculum.map((lesson) => <option key={lesson.id} value={lesson.id}>Week {lesson.week}: {lesson.title}</option>)}</Select></Field></form>
      </Modal>

      <Modal open={Boolean(recognitionAthlete)} onClose={() => setRecognitionAthlete(null)} title={`Recognize ${recognitionAthlete?.boardDisplayName ?? "athlete"}`} footer={<><Button variant="ghost" onClick={() => setRecognitionAthlete(null)}>Cancel</Button><Button type="submit" form="recognition-form" loading={busy}>Save recognition</Button></>}>
        {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
        <form id="recognition-form" className="stack" onSubmit={recognize}><Field label="What did you observe?" hint="Make it specific enough that the athlete can use it as evidence later."><Textarea required minLength={8} rows={4} value={recognitionText} onChange={(event) => setRecognitionText(event.target.value)}/></Field><Field label="Pillar"><PillarPicker value={recognitionPillar} onChange={setRecognitionPillar}/></Field><Field label="Tags" hint="Optional, separated by commas"><Input value={recognitionTags} onChange={(event) => setRecognitionTags(event.target.value)} placeholder="reset, stance, pressure"/></Field></form>
      </Modal>
    </div>
  );
}
