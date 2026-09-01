import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { DEFAULT_FIVE_CS, ROUTES, type FiveCsRatings, type WorkedOnFocus } from "../../domain";
import { useApp } from "../../app/AppContext";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { ExamplePicker } from "../../components/ExamplePicker";
import { Field, Textarea } from "../../components/Form";
import { FiveCsEditor } from "../../components/FiveCsEditor";
import { Icon } from "../../components/Icon";
import { PageHeader } from "../../components/PageHeader";
import { InlineStatus } from "../../components/Status";
import { useBusyAction } from "../../hooks/useBusyAction";

export function AfterPracticePage() {
  const { session, bundle, gateway, refresh, announce } = useApp();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { busy, localError, run } = useBusyAction();
  const checkin = bundle?.currentCheckin?.sessionId === sessionId ? bundle.currentCheckin : bundle?.currentCheckin;
  const bucket = (key: string) => bundle?.exampleBuckets.find((item) => item.key === key);
  const [worked, setWorked] = useState<WorkedOnFocus>(checkin?.after?.workedOnFocus ?? "yes");
  const [wentWell, setWentWell] = useState(checkin?.after?.wentWell ?? "");
  const [improve, setImprove] = useState(checkin?.after?.improve ?? "");
  const [gratitude, setGratitude] = useState(checkin?.after?.gratitude ?? "");
  const [saveProof, setSaveProof] = useState(Boolean(checkin?.evidenceId));
  const [showFiveCs, setShowFiveCs] = useState(Boolean(checkin?.after?.fiveCs));
  const [fiveCs, setFiveCs] = useState<FiveCsRatings>({ ...DEFAULT_FIVE_CS, ...checkin?.after?.fiveCs });
  const [nextAction, setNextAction] = useState<"keep" | "narrow" | "replace">(checkin?.after?.nextFocusAction ?? "keep");
  const [nextText, setNextText] = useState(checkin?.after?.nextFocusText ?? checkin?.before.focusText ?? "");

  if (!session || !bundle || !checkin) return <Navigate to={ROUTES.today} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() => gateway.saveAfterPractice({
      session,
      checkin,
      data: {
        workedOnFocus: worked,
        wentWell: wentWell.trim() || undefined,
        improve: improve.trim() || undefined,
        gratitude: gratitude.trim() || undefined,
        fiveCs: showFiveCs ? fiveCs : undefined,
        nextFocusAction: nextAction,
        nextFocusText: nextText.trim() || undefined,
      },
      saveEvidence: saveProof && Boolean(wentWell.trim()),
      evidenceText: wentWell.trim(),
      evidenceTags: [worked === "yes" ? "follow-through" : "learning"],
    }));
    if (!result) return;
    await refresh({ quiet: true });
    announce(result.evidence ? "Practice closed. Proof saved to your Confidence Bank." : "Practice closed. Keep the lesson and move forward.");
    navigate(result.evidence ? ROUTES.confidence : ROUTES.today, { replace: true });
  };

  return (
    <div className="page page--flow">
      <PageHeader back eyebrow="After practice" title="Keep the lesson" description="Notice what worked, choose one adjustment, then leave practice behind." />
      <form className="flow-form" onSubmit={submit}>
        {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
        <Card tone="dark" className="focus-recap">
          <div className="eyebrow eyebrow--light">Today's 1%</div>
          <h2>{checkin.before.focusText}</h2>
          {checkin.before.pillar ? <span className="focus-recap__pillar">{checkin.before.pillar}</span> : null}
        </Card>

        <Card>
          <Field label="Did you work on your 1%?">
            <div className="segmented" role="group" aria-label="Did you work on your focus">
              {(["yes", "partly", "not_yet"] as WorkedOnFocus[]).map((value) => <button type="button" key={value} className={worked === value ? "is-selected" : ""} onClick={() => setWorked(value)}>{value === "yes" ? "Yes" : value === "partly" ? "Partly" : "Not yet"}</button>)}
            </div>
          </Field>
        </Card>

        <Card>
          <Field label="What went well?" hint={bucket("went_well")?.why}>
            <ExamplePicker examples={bucket("went_well")?.examples ?? []} value={wentWell} onChange={(value) => setWentWell(value)} placeholder="Something I should remember" />
          </Field>
          {wentWell.trim() ? (
            <button type="button" className={`proof-toggle ${saveProof ? "is-selected" : ""}`} onClick={() => setSaveProof((value) => !value)}>
              <span className="proof-toggle__icon"><Icon name="heart" /></span>
              <span><strong>Save this as proof</strong><small>Add it to my Confidence Bank for later.</small></span>
              <span className="proof-toggle__check"><Icon name={saveProof ? "check" : "plus"} /></span>
            </button>
          ) : null}
        </Card>

        <Card>
          <Field label="What's one adjustment?" hint={bucket("improve")?.why}>
            <ExamplePicker examples={bucket("improve")?.examples ?? []} value={improve} onChange={(value) => setImprove(value)} placeholder="My next useful adjustment" />
          </Field>
        </Card>

        <Card>
          <h2>What happens to this focus?</h2>
          <div className="chip-list">
            <Chip selected={nextAction === "keep"} onClick={() => { setNextAction("keep"); setNextText(checkin.before.focusText); }}>Keep it</Chip>
            <Chip selected={nextAction === "narrow"} onClick={() => setNextAction("narrow")}>Narrow it</Chip>
            <Chip selected={nextAction === "replace"} onClick={() => setNextAction("replace")}>Replace it</Chip>
          </div>
          {nextAction !== "keep" ? <Field label={nextAction === "narrow" ? "Make it more specific" : "Choose a new starting point"}><Textarea rows={2} value={nextText} onChange={(event) => setNextText(event.target.value)} maxLength={90} /></Field> : null}
        </Card>

        <details className="details-card" open={showFiveCs} onToggle={(event) => setShowFiveCs((event.currentTarget as HTMLDetailsElement).open)}>
          <summary><span><strong>Check your Five Cs again</strong><small>Notice what changed. Do not grade yourself.</small></span></summary>
          <FiveCsEditor value={fiveCs} onChange={setFiveCs} />
        </details>

        <details className="details-card">
          <summary><span><strong>Optional gratitude</strong><small>Notice what supported you today</small></span></summary>
          <Field label="What supported you?">
            <ExamplePicker examples={bucket("gratitude")?.examples ?? []} value={gratitude} onChange={(value) => setGratitude(value)} placeholder="A person, body, or opportunity" />
          </Field>
        </details>

        <div className="sticky-submit">
          <Button full size="lg" type="submit" loading={busy} iconAfter="check">Close today's loop</Button>
          <p>Your private reflection stays private unless a later team policy explicitly says otherwise.</p>
        </div>
      </form>
    </div>
  );
}
