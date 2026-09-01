import { useMemo, useState, type FormEvent } from "react";
import {
  type CurriculumLesson,
  type ExampleBucket,
  type TeamChallenge,
  type TeamWin,
  type TechniqueTerm,
  type TermStatus,
} from "../../domain";
import { useApp } from "../../app/AppContext";
import { Button } from "../../components/Button";
import { Card, CardHeader } from "../../components/Card";
import { Chip, Tag } from "../../components/Chip";
import { Field, Input, Select, Textarea } from "../../components/Form";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { InlineStatus } from "../../components/Status";
import { createId } from "../../utils/id";
import { useBusyAction } from "../../hooks/useBusyAction";

const iso = () => new Date().toISOString();

export function CoachContentPage() {
  const { session, bundle, gateway, refresh, announce } = useApp();
  const [tab, setTab] = useState<"examples" | "lessons" | "terms" | "culture">("examples");
  const [exampleEdit, setExampleEdit] = useState<ExampleBucket | null>(null);
  const [lessonEdit, setLessonEdit] = useState<CurriculumLesson | null>(null);
  const [termEdit, setTermEdit] = useState<TechniqueTerm | null>(null);
  const [cultureModal, setCultureModal] = useState<"win" | "challenge" | null>(null);
  const [termSearch, setTermSearch] = useState("");
  const { busy, localError, run } = useBusyAction();
  if (!session || !bundle) return null;
  const terms = useMemo(() => bundle.terms.filter((term) => `${term.term} ${term.category} ${term.definition ?? ""}`.toLowerCase().includes(termSearch.toLowerCase())), [bundle.terms, termSearch]);

  const saveExample = async (event: FormEvent) => {
    event.preventDefault(); if (!exampleEdit) return;
    const result = await run(() => gateway.saveExampleBucket(session, exampleEdit));
    if (!result) return; await refresh({ quiet: true }); setExampleEdit(null); announce("Example bucket updated.");
  };
  const saveLesson = async (event: FormEvent) => {
    event.preventDefault(); if (!lessonEdit) return;
    const result = await run(() => gateway.saveCurriculumLesson(session, lessonEdit));
    if (!result) return; await refresh({ quiet: true }); setLessonEdit(null); announce("YOU University lesson updated.");
  };
  const saveTerm = async (event: FormEvent) => {
    event.preventDefault(); if (!termEdit) return;
    const clean = { ...termEdit, active: termEdit.status === "rejected" || termEdit.status === "legacy_verify" ? false : termEdit.active };
    const result = await run(() => gateway.saveTechniqueTerm(session, clean));
    if (!result) return; await refresh({ quiet: true }); setTermEdit(null); announce("Merrill terminology updated.");
  };

  return (
    <div className="page page--coach">
      <PageHeader eyebrow="Coach Content" title="Control the words and lessons" description="Examples teach athletes how to answer. Merrill terminology is added deliberately, never scraped into the app automatically." />
      <div className="content-tabs">{(["examples", "lessons", "terms", "culture"] as const).map((value) => <button type="button" key={value} className={tab === value ? "is-active" : ""} onClick={() => setTab(value)}>{value === "examples" ? "Examples" : value === "lessons" ? "YOU University" : value === "terms" ? "Terms" : "Team culture"}</button>)}</div>

      {tab === "examples" ? <div className="content-list">{bundle.exampleBuckets.map((bucket) => <Card key={bucket.id} className="content-item"><CardHeader eyebrow={bucket.key.replaceAll("_", " ")} title={bucket.prompt} action={<button className="icon-button icon-button--small" type="button" onClick={() => setExampleEdit({ ...bucket, examples: [...bucket.examples] })} aria-label={`Edit ${bucket.prompt}`}><Icon name="edit" size={17}/></button>}>{bucket.why}</CardHeader><div className="tag-row">{bucket.examples.slice(0, 5).map((example) => <Tag key={example}>{example}</Tag>)}{bucket.examples.length > 5 ? <Tag tone="blue">+{bucket.examples.length - 5}</Tag> : null}</div></Card>)}</div> : null}

      {tab === "lessons" ? <div className="content-list">{bundle.curriculum.map((lesson) => <button type="button" className="content-lesson" key={lesson.id} onClick={() => setLessonEdit({ ...lesson, examples: [...lesson.examples], tryItNow: { ...lesson.tryItNow, instructions: [...lesson.tryItNow.instructions] } })}><span className="content-lesson__week">{lesson.week}</span><span><small>{lesson.skillKey.replaceAll("_", " ")}</small><strong>{lesson.title}</strong><span>{lesson.useItToday}</span></span><Tag tone={lesson.status === "published" ? "green" : "default"}>{lesson.status}</Tag><Icon name="chevron" size={18}/></button>)}</div> : null}

      {tab === "terms" ? (
        <>
          <div className="search-row"><div className="search-box"><Icon name="search" size={18}/><Input value={termSearch} onChange={(event) => setTermSearch(event.target.value)} placeholder="Search active terms" /></div><Button size="sm" icon="plus" onClick={() => setTermEdit(newTerm())}>Add term</Button></div>
          <InlineStatus tone="info">Only active, coach-approved terminology reaches athlete screens. Rejected and legacy terms remain inactive.</InlineStatus>
          <div className="term-admin-list">{terms.map((term) => <button type="button" key={term.id} onClick={() => setTermEdit({ ...term, examples: [...term.examples], aliases: [...term.aliases] })}><span><strong>{term.term}</strong><small>{term.definition || "No definition added"}</small></span><span><Tag tone={term.status.startsWith("verified") ? "green" : "blue"}>{term.status.replaceAll("_", " ")}</Tag><Icon name="chevron" size={17}/></span></button>)}</div>
        </>
      ) : null}

      {tab === "culture" ? (
        <>
          <div className="button-row"><Button icon="plus" onClick={() => setCultureModal("win")}>Post Team Win</Button><Button variant="secondary" icon="target" onClick={() => setCultureModal("challenge")}>Create challenge</Button></div>
          <Card><CardHeader eyebrow="Published recognition" title="Team Wins"/>{bundle.teamWins.map((win) => <div className="culture-admin-row" key={win.id}><span><strong>{win.title}{win.athleteDisplayName ? ` · ${win.athleteDisplayName}` : ""}</strong><small>{win.text}</small></span>{win.pillar ? <Tag tone="blue">{win.pillar}</Tag> : null}</div>)}</Card>
          <Card><CardHeader eyebrow="Cooperative progress" title="Team challenges"/>{bundle.challenges.map((challenge) => <div className="culture-admin-row" key={challenge.id}><span><strong>{challenge.title}</strong><small>{challenge.description}</small></span><Tag>{challenge.current}/{challenge.target}</Tag></div>)}</Card>
        </>
      ) : null}

      <Modal open={Boolean(exampleEdit)} onClose={() => setExampleEdit(null)} title="Edit example bucket" wide footer={<><Button variant="ghost" onClick={() => setExampleEdit(null)}>Cancel</Button><Button type="submit" form="example-editor" loading={busy}>Save bucket</Button></>}>
        {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
        {exampleEdit ? <form id="example-editor" className="stack" onSubmit={saveExample}><Field label="Prompt"><Input value={exampleEdit.prompt} onChange={(event) => setExampleEdit({ ...exampleEdit, prompt: event.target.value })}/></Field><Field label="Why this question matters"><Textarea rows={2} value={exampleEdit.why} onChange={(event) => setExampleEdit({ ...exampleEdit, why: event.target.value })}/></Field><Field label="Examples" hint="One short example per line. Athletes can always choose My own."><Textarea rows={10} value={exampleEdit.examples.join("\n")} onChange={(event) => setExampleEdit({ ...exampleEdit, examples: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })}/></Field><label className="switch-row"><span><strong>Active</strong><small>Show this bucket in athlete flows</small></span><input type="checkbox" checked={exampleEdit.active} onChange={(event) => setExampleEdit({ ...exampleEdit, active: event.target.checked })}/></label></form> : null}
      </Modal>

      <Modal open={Boolean(lessonEdit)} onClose={() => setLessonEdit(null)} title="Edit YOU University lesson" wide footer={<><Button variant="ghost" onClick={() => setLessonEdit(null)}>Cancel</Button><Button type="submit" form="lesson-editor" loading={busy}>Save lesson</Button></>}>
        {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
        {lessonEdit ? <form id="lesson-editor" className="stack" onSubmit={saveLesson}><div className="form-grid"><Field label="Week"><Input type="number" min="0" max="30" value={lessonEdit.week} onChange={(event) => setLessonEdit({ ...lessonEdit, week: Number(event.target.value) })}/></Field><Field label="Status"><Select value={lessonEdit.status} onChange={(event) => setLessonEdit({ ...lessonEdit, status: event.target.value as CurriculumLesson["status"] })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></Field></div><Field label="Title"><Input value={lessonEdit.title} onChange={(event) => setLessonEdit({ ...lessonEdit, title: event.target.value })}/></Field><Field label="Why it matters"><Textarea rows={4} value={lessonEdit.whyItMatters} onChange={(event) => setLessonEdit({ ...lessonEdit, whyItMatters: event.target.value })}/></Field><Field label="Examples" hint="One per line"><Textarea rows={5} value={lessonEdit.examples.join("\n")} onChange={(event) => setLessonEdit({ ...lessonEdit, examples: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })}/></Field><Field label="Try-it instructions" hint="One step per line"><Textarea rows={5} value={lessonEdit.tryItNow.instructions.join("\n")} onChange={(event) => setLessonEdit({ ...lessonEdit, tryItNow: { ...lessonEdit.tryItNow, instructions: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) } })}/></Field><Field label="Use it today"><Textarea rows={2} value={lessonEdit.useItToday} onChange={(event) => setLessonEdit({ ...lessonEdit, useItToday: event.target.value })}/></Field><Field label="Reflection prompt"><Textarea rows={2} value={lessonEdit.reflectPrompt} onChange={(event) => setLessonEdit({ ...lessonEdit, reflectPrompt: event.target.value })}/></Field></form> : null}
      </Modal>

      <Modal open={Boolean(termEdit)} onClose={() => setTermEdit(null)} title="Merrill term" wide footer={<><Button variant="ghost" onClick={() => setTermEdit(null)}>Cancel</Button><Button type="submit" form="term-editor" loading={busy}>Save term</Button></>}>
        {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
        {termEdit ? <form id="term-editor" className="stack" onSubmit={saveTerm}><div className="form-grid"><Field label="Term"><Input required value={termEdit.term} onChange={(event) => setTermEdit({ ...termEdit, term: event.target.value })}/></Field><Field label="Category"><Input required value={termEdit.category} onChange={(event) => setTermEdit({ ...termEdit, category: event.target.value })}/></Field></div><Field label="Status"><Select value={termEdit.status} onChange={(event) => setTermEdit({ ...termEdit, status: event.target.value as TermStatus })}><option value="verified_arnie_primary">Verified · Arnie primary</option><option value="verified_coach_merrill">Verified · Coach/Merrill</option><option value="current_project_term">Current project term</option><option value="starter_language">Starter language</option><option value="legacy_verify">Legacy · verify</option><option value="rejected">Rejected</option></Select></Field><Field label="Working definition"><Textarea rows={3} value={termEdit.definition ?? ""} onChange={(event) => setTermEdit({ ...termEdit, definition: event.target.value || undefined })}/></Field><Field label="Athlete explanation"><Textarea rows={3} value={termEdit.athleteExplanation ?? ""} onChange={(event) => setTermEdit({ ...termEdit, athleteExplanation: event.target.value || undefined })}/></Field><Field label="Coach cue"><Input value={termEdit.coachCue ?? ""} onChange={(event) => setTermEdit({ ...termEdit, coachCue: event.target.value || undefined })}/></Field><Field label="Examples" hint="One per line"><Textarea rows={4} value={termEdit.examples.join("\n")} onChange={(event) => setTermEdit({ ...termEdit, examples: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })}/></Field><Field label="Source"><Input required value={termEdit.source} onChange={(event) => setTermEdit({ ...termEdit, source: event.target.value })}/></Field><label className="switch-row"><span><strong>Active in app</strong><small>Legacy and rejected terms cannot be activated.</small></span><input type="checkbox" checked={termEdit.active} disabled={["legacy_verify", "rejected"].includes(termEdit.status)} onChange={(event) => setTermEdit({ ...termEdit, active: event.target.checked })}/></label></form> : null}
      </Modal>

      <CultureModal kind={cultureModal} onClose={() => setCultureModal(null)} />
    </div>
  );
}

function newTerm(): TechniqueTerm {
  const current = iso();
  return { id: createId("term"), term: "", normalizedKey: "", category: "team_language", status: "verified_coach_merrill", definition: "", examples: [], source: "Coach-verified Merrill usage", aliases: [], active: true, createdAt: current, updatedAt: current };
}

function CultureModal({ kind, onClose }: { kind: "win" | "challenge" | null; onClose(): void }) {
  const { session, gateway, refresh, announce } = useApp();
  const { busy, localError, run } = useBusyAction();
  const [title, setTitle] = useState(kind === "challenge" ? "" : "Team Win");
  const [text, setText] = useState("");
  const [target, setTarget] = useState(10);
  const [unit, setUnit] = useState("wrestlers");
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!session || !kind) return;
    const result = kind === "win"
      ? await run(() => gateway.saveTeamWin(session, { title, text, kind: "team_win" } as TeamWin))
      : await run(() => gateway.saveTeamChallenge(session, { title, description: text, target, unit } as TeamChallenge));
    if (!result) return; await refresh({ quiet: true }); onClose(); announce(kind === "win" ? "Team Win published." : "Cooperative team challenge created.");
  };
  return <Modal open={Boolean(kind)} onClose={onClose} title={kind === "win" ? "Post a Team Win" : "Create a team challenge"} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="culture-editor" loading={busy}>Publish</Button></>}>
    {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
    <form id="culture-editor" className="stack" onSubmit={save}><Field label="Title"><Input required value={title} onChange={(event) => setTitle(event.target.value)}/></Field><Field label={kind === "win" ? "What should the room recognize?" : "What will the team practice together?"}><Textarea required rows={4} value={text} onChange={(event) => setText(event.target.value)}/></Field>{kind === "challenge" ? <div className="form-grid"><Field label="Target"><Input type="number" min="1" value={target} onChange={(event) => setTarget(Number(event.target.value))}/></Field><Field label="Unit"><Input value={unit} onChange={(event) => setUnit(event.target.value)}/></Field></div> : null}</form>
  </Modal>;
}
