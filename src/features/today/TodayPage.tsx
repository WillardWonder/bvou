import { Link, useNavigate } from "react-router-dom";
import { BRAND, ROUTES, selectRelevantEvidence } from "../../domain";
import { useApp } from "../../app/AppContext";
import { Button } from "../../components/Button";
import { Card, CardHeader } from "../../components/Card";
import { EvidenceCard } from "../../components/EvidenceCard";
import { Icon } from "../../components/Icon";
import { EmptyState } from "../../components/Status";
import { Tag } from "../../components/Chip";
import { formatDate, relativeDate } from "../../utils/date";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";

export function TodayPage() {
  const { session, bundle, online, announce } = useApp();
  const navigate = useNavigate();
  const installPrompt = useInstallPrompt();
  if (!session || !bundle) return null;
  const practice = bundle.currentSession;
  const checkin = bundle.currentCheckin;
  const beforeDone = Boolean(checkin?.before.completedAt);
  const afterDone = Boolean(checkin?.after?.completedAt);
  const currentLesson = bundle.curriculum.find((lesson) => lesson.id === practice?.curriculumLessonId)
    ?? bundle.curriculum.find((lesson) => !bundle.lessonProgress.some((progress) => progress.lessonId === lesson.id && progress.status === "completed"));
  const proof = selectRelevantEvidence({
    evidence: bundle.evidence,
    context: practice ? "today" : "weekly",
    limit: 1,
    currentPillar: checkin?.before.pillar,
    currentTags: checkin?.before.focusText.toLowerCase().split(/\W+/).filter(Boolean) ?? [],
  })[0];
  const upcomingPlan = bundle.competitionPlans.filter((plan) => plan.status === "active").sort((a, b) => a.eventDate.localeCompare(b.eventDate))[0];

  const primary = !practice
    ? { label: "No practice is open", text: "You do not need to manufacture a task today.", action: null }
    : !beforeDone
      ? { label: "Set today's 1%", text: "Choose one clear job before you enter practice.", action: () => navigate(ROUTES.beforePractice(practice.id)) }
      : !afterDone
        ? { label: "Today's job", text: checkin!.before.focusText, action: () => navigate(ROUTES.afterPractice(practice.id)) }
        : { label: "Loop complete", text: "You planned it, used it, and learned from it.", action: null };

  return (
    <div className="page page--today">
      <section className="today-greeting">
        <div>
          <div className="eyebrow">{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" }).format(new Date())}</div>
          <h1>Hi, {session.displayName.split(" ")[0]}.</h1>
          <p>{beforeDone && !afterDone ? "Keep the next job simple." : afterDone ? "Keep what helped. Leave what didn't." : "What matters today?"}</p>
        </div>
        <img src={BRAND.compactLogo} alt="" className="today-greeting__mark" />
      </section>

      <Card tone="dark" className="hero-action-card">
        <div className="hero-action-card__top">
          <span className="live-dot" />
          <span>{practice ? `${relativeDate(practice.startsAt ?? practice.dateKey)} practice` : "Rest day"}</span>
          {!online ? <Tag tone="dark">Saves offline</Tag> : null}
        </div>
        <div className="eyebrow eyebrow--light">{primary.label}</div>
        <h2>{primary.text}</h2>
        {practice?.teamTheme ? <p>Room focus: {practice.teamTheme}</p> : null}
        {beforeDone && checkin?.before.pillar ? <div className="hero-action-card__pillar">{checkin.before.pillar}</div> : null}
        {primary.action ? <Button size="lg" full onClick={primary.action} iconAfter="arrow">{beforeDone ? "Close the loop" : "Choose my focus"}</Button> : null}
        {afterDone ? <Button size="lg" full variant="secondary" onClick={() => navigate(ROUTES.confidence)} icon="heart">Open my proof</Button> : null}
      </Card>

      <div className="quick-grid">
        <Link className="quick-card" to={ROUTES.resetSweep}><span className="quick-card__icon"><Icon name="eye"/></span><strong>Reset</strong><small>20–45 seconds</small></Link>
        <Link className="quick-card" to={ROUTES.curriculum}><span className="quick-card__icon"><Icon name="book"/></span><strong>YOU University</strong><small>{currentLesson ? `Week ${currentLesson.week}` : "Complete"}</small></Link>
        <Link className="quick-card" to={ROUTES.confidence}><span className="quick-card__icon"><Icon name="heart"/></span><strong>Confidence Bank</strong><small>{bundle.evidence.filter((item) => !item.archived).length} proofs</small></Link>
      </div>

      {proof ? (
        <Card tone="blue" className="memory-card">
          <CardHeader eyebrow="You've done this before" title="Proof for today" action={<Link to={ROUTES.confidence}>See bank</Link>} />
          <EvidenceCard item={proof} compact />
        </Card>
      ) : null}

      {currentLesson ? (
        <Card>
          <CardHeader eyebrow="This week's skill" title={currentLesson.title} action={<Tag tone="blue">Week {currentLesson.week}</Tag>}>
            {currentLesson.whyItMatters.slice(0, 125)}{currentLesson.whyItMatters.length > 125 ? "…" : ""}
          </CardHeader>
          <Button variant="secondary" full iconAfter="arrow" onClick={() => navigate(ROUTES.lesson(currentLesson.id))}>Learn it, then use it</Button>
        </Card>
      ) : null}

      {upcomingPlan ? (
        <Card className="competition-preview">
          <div className="competition-preview__date"><span>{new Date(`${upcomingPlan.eventDate}T12:00:00`).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</span><strong>{new Date(`${upcomingPlan.eventDate}T12:00:00`).getDate()}</strong></div>
          <div><div className="eyebrow">Next competition</div><h2>{upcomingPlan.eventName}</h2><p>{upcomingPlan.firstJob || "Add your first job"}</p></div>
          <button type="button" className="icon-button" onClick={() => navigate(ROUTES.compete)} aria-label="Open competition plan"><Icon name="chevron"/></button>
        </Card>
      ) : null}

      {bundle.teamWins[0] ? (
        <Card>
          <CardHeader eyebrow={bundle.teamWins[0].title} title={bundle.teamWins[0].athleteDisplayName || "The room"} />
          <p className="large-copy">{bundle.teamWins[0].text}</p>
        </Card>
      ) : null}

      {!practice && !currentLesson && !upcomingPlan ? <EmptyState title="Nothing required today" text="Recovery and life outside wrestling matter too. Come back when the next real action is ready." /> : null}

      {installPrompt.canInstall ? (
        <button type="button" className="install-card" onClick={async () => { if (await installPrompt.install()) announce("Merrill Girls Wrestling was added to your home screen."); }}>
          <Icon name="download"/><span><strong>Add to home screen</strong><small>Open it like any other app</small></span><Icon name="chevron"/>
        </button>
      ) : null}

      <div className="today-footer-note">Your private entries stay out of the Practice Board.</div>
    </div>
  );
}
