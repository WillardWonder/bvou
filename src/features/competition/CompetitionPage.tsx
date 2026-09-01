import { useEffect, useMemo, useState, type FormEvent } from "react";
import { selectRelevantEvidence, type CompetitionPlan, type Pillar } from "../../domain";
import { useApp } from "../../app/AppContext";
import { Button } from "../../components/Button";
import { Card, CardHeader } from "../../components/Card";
import { Chip, Tag } from "../../components/Chip";
import { EvidenceCard } from "../../components/EvidenceCard";
import { Field, Input, Textarea } from "../../components/Form";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { PillarPicker } from "../../components/PillarPicker";
import { EmptyState, InlineStatus } from "../../components/Status";
import { formatDate, relativeDate } from "../../utils/date";
import { useBusyAction } from "../../hooks/useBusyAction";

const blankPlan = (): Partial<CompetitionPlan> & Pick<CompetitionPlan, "eventName" | "eventDate"> => ({
  eventName: "",
  eventDate: new Date().toISOString().slice(0, 10),
  outcomeDirection: "",
  processGoals: [],
  firstJob: "",
  cue: "",
  routineSteps: ["Move", "Easy breath", "Say my cue", "Find my stance", "Do my first job"],
  ifThenPlans: [],
  betweenPeriods: "Listen to one instruction, repeat one cue, get to the next start.",
  betweenMatches: "Recover, keep one lesson, reset for the next plan.",
  status: "active",
});

export function CompetitionPage() {
  const { session, bundle, gateway, refresh, announce } = useApp();
  const { busy, localError, run } = useBusyAction();
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const plans = bundle?.competitionPlans ?? [];
  const selected = plans.find((item) => item.id === selectedId) ?? plans.find((item) => item.status === "active") ?? plans[0];
  const [draft, setDraft] = useState(blankPlan());
  const [mode, setMode] = useState<"card" | "between" | "review">("card");

  useEffect(() => {
    if (selected) setDraft({ ...selected, routineSteps: [...selected.routineSteps], processGoals: [...selected.processGoals], ifThenPlans: selected.ifThenPlans.map((item) => ({ ...item })) });
  }, [selected?.id]);

  const evidence = useMemo(() => selectRelevantEvidence({
    evidence: bundle?.evidence ?? [], context: "competition", limit: 3, currentPillar: selected?.pillar,
    currentTags: [selected?.cue ?? "", selected?.firstJob ?? "", ...(selected?.processGoals ?? [])].join(" ").toLowerCase().split(/\W+/).filter(Boolean),
  }), [bundle?.evidence, selected]);

  if (!session || !bundle) return null;
  const openNew = () => { setSelectedId(undefined); setDraft(blankPlan()); setEditing(true); };
  const openEdit = () => { if (selected) { setDraft({ ...selected, routineSteps: [...selected.routineSteps], processGoals: [...selected.processGoals], ifThenPlans: selected.ifThenPlans.map((item) => ({ ...item })) }); setEditing(true); } };
  const listValue = (items?: string[]) => (items ?? []).join("\n");
  const parseLines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
  const ifThenText = (items?: Array<{ if: string; then: string }>) => (items ?? []).map((item) => `${item.if} -> ${item.then}`).join("\n");
  const parseIfThen = (value: string) => parseLines(value).map((line) => {
    const [condition, ...response] = line.split(/\s*->\s*|\s*=>\s*/);
    return { if: condition || line, then: response.join(" -> ") || "Breathe, center, return to my next job" };
  });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() => gateway.saveCompetitionPlan(session, {
      ...draft,
      id: draft.id,
      eventName: draft.eventName.trim(),
      eventDate: draft.eventDate,
      processGoals: draft.processGoals ?? [],
      firstJob: draft.firstJob?.trim() ?? "",
      cue: draft.cue?.trim() ?? "",
      routineSteps: draft.routineSteps ?? [],
      ifThenPlans: draft.ifThenPlans ?? [],
    }));
    if (!result) return;
    await refresh({ quiet: true });
    setSelectedId(result.id);
    setEditing(false);
    announce("Competition plan saved. Practice it before you need it.");
  };

  const saveReview = async (reflection: CompetitionPlan["reflection"]) => {
    if (!selected) return;
    const result = await run(() => gateway.saveCompetitionPlan(session, { ...selected, eventName: selected.eventName, eventDate: selected.eventDate, reflection, status: "completed" }));
    if (result && reflection?.wentWell) await gateway.saveEvidence(session, { text: reflection.wentWell, source: "competition", contextLabel: selected.eventName, tags: ["competition", "proof"], pillar: selected.pillar });
    await refresh({ quiet: true });
    announce("Competition reviewed. The lesson is ready for your next practice.");
    setMode("card");
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Compete" title="Use the plan you practiced" description="Competition day should get simpler, not louder." action={<button className="icon-button" type="button" onClick={selected ? openEdit : openNew} aria-label={selected ? "Edit competition plan" : "Create competition plan"}><Icon name={selected ? "edit" : "plus"}/></button>} />
      {!selected ? <EmptyState title="Build your first competition card" text="Choose a first job, cue, short routine, and response for predictable adversity." action={<Button onClick={openNew} icon="plus">Create a plan</Button>} /> : (
        <>
          {plans.length > 1 ? <div className="horizontal-chips">{plans.map((plan) => <Chip key={plan.id} selected={plan.id === selected.id} onClick={() => setSelectedId(plan.id)}>{plan.eventName}</Chip>)}</div> : null}
          <div className="competition-modes">{(["card", "between", "review"] as const).map((value) => <button type="button" key={value} onClick={() => setMode(value)} className={mode === value ? "is-active" : ""}>{value === "card" ? "My card" : value === "between" ? "Between" : "Review"}</button>)}</div>

          {mode === "card" ? (
            <>
              <Card tone="dark" className="competition-card">
                <div className="competition-card__head"><div><div className="eyebrow eyebrow--light">{relativeDate(selected.eventDate)}</div><h2>{selected.eventName}</h2><p>{formatDate(selected.eventDate)}</p></div>{selected.pillar ? <span className="competition-card__pillar">{selected.pillar}</span> : null}</div>
                <div className="competition-card__primary"><span>First job</span><strong>{selected.firstJob || "Add one clear first job"}</strong></div>
                <div className="competition-card__cue"><span>Cue</span><strong>{selected.cue || "Add one short cue"}</strong></div>
                {selected.processGoals.length ? <div className="competition-card__goals">{selected.processGoals.map((goal) => <Tag tone="dark" key={goal}>{goal}</Tag>)}</div> : null}
              </Card>
              <Card>
                <CardHeader eyebrow="My routine" title="Same path into performance" />
                <ol className="routine-list">{selected.routineSteps.map((step, index) => <li key={`${step}-${index}`}><span>{index + 1}</span><strong>{step}</strong></li>)}</ol>
              </Card>
              {selected.ifThenPlans.length ? <Card><CardHeader eyebrow="Adversity plans" title="Already decide the response" />{selected.ifThenPlans.map((plan) => <div className="if-then" key={`${plan.if}-${plan.then}`}><span>If</span><p>{plan.if}</p><Icon name="arrow"/><span>Then</span><p>{plan.then}</p></div>)}</Card> : null}
              {evidence.length ? <Card tone="blue"><CardHeader eyebrow="You've done this before" title="Proof for competition" />{evidence.map((item) => <EvidenceCard key={item.id} item={item} compact />)}</Card> : null}
              <Button full size="lg" variant="secondary" onClick={openEdit} icon="edit">Edit this card</Button>
            </>
          ) : null}

          {mode === "between" ? (
            <>
              <Card tone="dark"><CardHeader eyebrow="Between periods" title="One instruction. One cue. Next start." /><p className="large-copy">{selected.betweenPeriods || "Listen, breathe, repeat the cue, get ready."}</p></Card>
              <Card><CardHeader eyebrow="Between matches" title="Recover without replaying everything" /><p className="large-copy">{selected.betweenMatches || "Hydrate, recover, keep one lesson, reset."}</p></Card>
              <Button full size="lg" onClick={() => location.assign("/app/reset-sweep")} icon="eye">Open Reset Sweep</Button>
            </>
          ) : null}

          {mode === "review" ? <CompetitionReview plan={selected} busy={busy} error={localError} onSave={saveReview} /> : null}
        </>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title={draft.id ? "Edit competition plan" : "New competition plan"} wide footer={<><Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit" form="competition-plan-form" loading={busy}>Save plan</Button></>}>
        {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
        <form id="competition-plan-form" className="stack" onSubmit={save}>
          <div className="form-grid"><Field label="Event"><Input required value={draft.eventName} onChange={(event) => setDraft({ ...draft, eventName: event.target.value })}/></Field><Field label="Date"><Input type="date" required value={draft.eventDate} onChange={(event) => setDraft({ ...draft, eventDate: event.target.value })}/></Field></div>
          <Field label="What direction are you working toward?" hint="An outcome can give direction, but the card will emphasize controllable actions."><Input value={draft.outcomeDirection ?? ""} onChange={(event) => setDraft({ ...draft, outcomeDirection: event.target.value })}/></Field>
          <Field label="Pillar"><PillarPicker value={draft.pillar} onChange={(pillar: Pillar | undefined) => setDraft({ ...draft, pillar })}/></Field>
          <div className="form-grid"><Field label="First job"><Input required value={draft.firstJob ?? ""} onChange={(event) => setDraft({ ...draft, firstJob: event.target.value })} placeholder="Be first to contact"/></Field><Field label="Cue"><Input required value={draft.cue ?? ""} onChange={(event) => setDraft({ ...draft, cue: event.target.value })} placeholder="Next exchange"/></Field></div>
          <Field label="Process goals" hint="One per line"><Textarea rows={3} value={listValue(draft.processGoals)} onChange={(event) => setDraft({ ...draft, processGoals: parseLines(event.target.value) })}/></Field>
          <Field label="Routine steps" hint="One per line"><Textarea rows={5} value={listValue(draft.routineSteps)} onChange={(event) => setDraft({ ...draft, routineSteps: parseLines(event.target.value) })}/></Field>
          <Field label="If-then plans" hint="One per line, like: I give up first points -> Breathe and attack the next exchange"><Textarea rows={4} value={ifThenText(draft.ifThenPlans)} onChange={(event) => setDraft({ ...draft, ifThenPlans: parseIfThen(event.target.value) })}/></Field>
          <Field label="Between periods"><Textarea rows={2} value={draft.betweenPeriods ?? ""} onChange={(event) => setDraft({ ...draft, betweenPeriods: event.target.value })}/></Field>
          <Field label="Between matches"><Textarea rows={2} value={draft.betweenMatches ?? ""} onChange={(event) => setDraft({ ...draft, betweenMatches: event.target.value })}/></Field>
        </form>
      </Modal>
    </div>
  );
}

function CompetitionReview({ plan, busy, error, onSave }: { plan: CompetitionPlan; busy: boolean; error: string | null; onSave(reflection: CompetitionPlan["reflection"]): Promise<void> }) {
  const [used, setUsed] = useState(plan.reflection?.planUsed ?? "");
  const [wentWell, setWentWell] = useState(plan.reflection?.wentWell ?? "");
  const [adjustment, setAdjustment] = useState(plan.reflection?.adjustment ?? "");
  const [nextFocus, setNextFocus] = useState(plan.reflection?.nextFocus ?? "");
  return (
    <form className="stack" onSubmit={(event) => { event.preventDefault(); void onSave({ planUsed: used, wentWell, adjustment, nextFocus, completedAt: new Date().toISOString() }); }}>
      {error ? <InlineStatus tone="error">{error}</InlineStatus> : null}
      <Card><CardHeader eyebrow="Review the plan" title="What did you actually use?"/><Field label="Routine, cue, first job, or if-then plan"><Textarea rows={3} value={used} onChange={(event) => setUsed(event.target.value)}/></Field></Card>
      <Card><Field label="What went well?"><Textarea rows={3} value={wentWell} onChange={(event) => setWentWell(event.target.value)} placeholder="Save something future you should remember"/></Field></Card>
      <Card><Field label="One adjustment"><Textarea rows={3} value={adjustment} onChange={(event) => setAdjustment(event.target.value)}/></Field></Card>
      <Card><Field label="Next 1%"><Input value={nextFocus} onChange={(event) => setNextFocus(event.target.value)}/></Field></Card>
      <Button full size="lg" type="submit" loading={busy} iconAfter="check">Keep the lesson</Button>
    </form>
  );
}
