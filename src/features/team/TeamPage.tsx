import { BRAND } from "../../domain";
import { useApp } from "../../app/AppContext";
import { Card, CardHeader } from "../../components/Card";
import { Icon } from "../../components/Icon";
import { PageHeader } from "../../components/PageHeader";
import { ProgressBar } from "../../components/Progress";
import { Tag } from "../../components/Chip";
import { formatDate } from "../../utils/date";

export function TeamPage() {
  const { bundle } = useApp();
  if (!bundle) return null;
  const readyCount = bundle.boardEntries.filter((entry) => entry.state === "ready").length;
  const athleteCount = Math.max(readyCount, bundle.memberships.filter((item) => item.role === "athlete").length);
  return (
    <div className="page">
      <PageHeader eyebrow="Team" title="Strengthen the room" description="Shared standards, cooperative progress, and recognition for real behavior. No popularity contest." />
      <Card tone="dark" className="team-room-card">
        <img src={BRAND.primaryLogo} alt="Merrill Girls Wrestling" />
        <div><div className="eyebrow eyebrow--light">Room standard</div><h2>Keep wrestling. Every day is a new match.</h2></div>
      </Card>

      {bundle.currentSession ? <Card><CardHeader eyebrow="Today's room" title={bundle.currentSession.teamTheme || "One clear job"} action={<Tag tone="blue">{readyCount}/{athleteCount || readyCount} ready</Tag>}/><ProgressBar value={readyCount} max={athleteCount || readyCount || 1}/><div className="team-focus-preview">{bundle.boardEntries.filter((entry) => entry.state === "ready").slice(0, 6).map((entry) => <div key={entry.athleteUid}><strong>{entry.boardDisplayName}</strong><span>{entry.focusText}</span></div>)}</div></Card> : null}

      {bundle.challenges.map((challenge) => <Card key={challenge.id} tone="blue"><CardHeader eyebrow="Team challenge" title={challenge.title} action={challenge.endsOn ? <Tag>{formatDate(challenge.endsOn, { month: "short", day: "numeric" })}</Tag> : null}>{challenge.description}</CardHeader><ProgressBar value={challenge.current} max={challenge.target} label={`${challenge.current} of ${challenge.target} ${challenge.unit}`}/><p className="fine-print">Everyone contributes. Nobody is ranked.</p></Card>)}

      <div className="team-feed">
        {bundle.teamWins.map((win) => <Card key={win.id} className="team-win-card"><div className={`team-win-card__mark team-win-card__mark--${win.kind}`}><Icon name={win.kind === "coach_noticed" ? "coach" : win.kind === "teammate_recognition" ? "team" : "trophy"}/></div><div className="team-win-card__copy"><div className="team-win-card__meta"><span>{win.title}</span>{win.pillar ? <Tag tone="blue">{win.pillar}</Tag> : null}</div><h2>{win.athleteDisplayName || "Merrill Girls Wrestling"}</h2><p>{win.text}</p>{win.publishedAt ? <small>{formatDate(win.publishedAt, { month: "short", day: "numeric" })}</small> : null}</div></Card>)}
      </div>

      <Card><CardHeader eyebrow="Culture" title="What belongs here"/><div className="culture-grid"><div><Icon name="check"/><span>Specific coach recognition</span></div><div><Icon name="check"/><span>Team Wins and milestones</span></div><div><Icon name="check"/><span>Shared standards and challenges</span></div><div><Icon name="lock"/><span>No likes, followers, or private messages</span></div></div></Card>
    </div>
  );
}
