import { useMemo, useState, type FormEvent } from "react";
import { selectRelevantEvidence, type ConfidenceEvidence, type Pillar } from "../../domain";
import { useApp } from "../../app/AppContext";
import { Button } from "../../components/Button";
import { Card, CardHeader } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { EvidenceCard } from "../../components/EvidenceCard";
import { Field, Input, Textarea } from "../../components/Form";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { PillarPicker } from "../../components/PillarPicker";
import { EmptyState, InlineStatus } from "../../components/Status";
import { useBusyAction } from "../../hooks/useBusyAction";

export function ConfidenceBankPage() {
  const { session, bundle, gateway, refresh, announce } = useApp();
  const [queryText, setQueryText] = useState("");
  const [filter, setFilter] = useState<"all" | "pinned" | "coach" | "competition">("all");
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [pillar, setPillar] = useState<Pillar | undefined>();
  const [tags, setTags] = useState("");
  const { busy, localError, run } = useBusyAction();
  if (!session || !bundle) return null;
  const active = bundle.evidence.filter((item) => !item.archived);
  const featured = selectRelevantEvidence({ evidence: active, context: "manual", limit: 1 })[0];
  const filtered = useMemo(() => active.filter((item) => {
    const search = `${item.text} ${item.contextLabel ?? ""} ${item.tags.join(" ")}`.toLowerCase();
    if (queryText && !search.includes(queryText.toLowerCase())) return false;
    if (filter === "pinned" && !item.pinned) return false;
    if (filter === "coach" && item.source !== "coach") return false;
    if (filter === "competition" && item.source !== "competition") return false;
    return true;
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.occurredAt.localeCompare(a.occurredAt)), [active, filter, queryText]);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    const item = await run(() => gateway.saveEvidence(session, { text, contextLabel: context || "Something I want to remember", pillar, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), source: "self" }));
    if (!item) return;
    await refresh({ quiet: true });
    setAdding(false); setText(""); setContext(""); setTags(""); setPillar(undefined);
    announce("Proof saved. Future you can use this.");
  };
  const update = async (item: ConfidenceEvidence, patch: Partial<ConfidenceEvidence>) => {
    await run(() => gateway.updateEvidence(session, item.id, { athleteUid: item.athleteUid, ...patch }));
    await refresh({ quiet: true });
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Confidence Bank" title="Real proof, kept on purpose" description="Save preparation, progress, response, and moments you have already handled." action={<button type="button" className="icon-button" onClick={() => setAdding(true)} aria-label="Add proof"><Icon name="plus"/></button>} />
      {featured ? <Card tone="dark" className="featured-proof"><div className="eyebrow eyebrow--light">Future you should remember</div><EvidenceCard item={featured} compact/></Card> : null}
      <div className="search-row"><div className="search-box"><Icon name="search" size={19}/><Input value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Search my proof" aria-label="Search confidence evidence"/></div><button type="button" className="icon-button" onClick={() => setAdding(true)} aria-label="Add evidence"><Icon name="plus"/></button></div>
      <div className="horizontal-chips">{(["all", "pinned", "coach", "competition"] as const).map((value) => <Chip key={value} selected={filter === value} onClick={() => setFilter(value)}>{value === "all" ? "All proof" : value === "pinned" ? "Pinned" : value === "coach" ? "Coach noticed" : "Competition"}</Chip>)}</div>
      {filtered.length ? <div className="evidence-list">{filtered.map((item) => <EvidenceCard key={item.id} item={item} onPin={() => void update(item, { pinned: !item.pinned })} onArchive={() => void update(item, { archived: true })}/>)}</div> : <EmptyState title="No proof in this view" text="Change the filter or save something preparation, progress, response, or pressure has already shown you." action={<Button onClick={() => setAdding(true)} icon="plus">Save proof</Button>}/>} 
      <Card tone="blue"><CardHeader eyebrow="Confidence is not hype" title="Use what you have already earned"/><p className="large-copy">Before competition, the app can resurface relevant proof. The bank stays valuable because each entry points to something that actually happened.</p></Card>

      <Modal open={adding} onClose={() => setAdding(false)} title="Save something worth remembering" footer={<><Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button><Button type="submit" form="evidence-form" loading={busy}>Save proof</Button></>}>
        {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
        <form id="evidence-form" className="stack" onSubmit={add}>
          <Field label="What did you prove?" hint="Describe the response, skill, preparation, or progress. Keep it specific."><Textarea required minLength={8} rows={4} maxLength={320} value={text} onChange={(event) => setText(event.target.value)} placeholder="I gave up the first score, reset, and attacked the next exchange."/></Field>
          <Field label="Where or when?"><Input value={context} onChange={(event) => setContext(event.target.value)} placeholder="Practice, tournament, strength training..."/></Field>
          <Field label="Pillar"><PillarPicker value={pillar} onChange={setPillar}/></Field>
          <Field label="Tags" hint="Optional, separated by commas"><Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="reset, pressure, setup"/></Field>
        </form>
      </Modal>
    </div>
  );
}
