import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../domain";
import { useApp } from "../../app/AppContext";
import { Card, CardHeader } from "../../components/Card";
import { Icon } from "../../components/Icon";
import { PageHeader } from "../../components/PageHeader";
import { ProgressBar } from "../../components/Progress";
import { Tag } from "../../components/Chip";

export function UniversityPage() {
  const { bundle } = useApp();
  const navigate = useNavigate();
  if (!bundle) return null;
  const completeIds = new Set(bundle.lessonProgress.filter((item) => item.status === "completed").map((item) => item.lessonId));
  const appliedIds = new Set(bundle.lessonProgress.filter((item) => item.status === "applied").map((item) => item.lessonId));
  const next = bundle.curriculum.find((lesson) => !completeIds.has(lesson.id));
  const percent = Math.round((completeIds.size / Math.max(1, bundle.curriculum.length)) * 100);
  return (
    <div className="page">
      <PageHeader eyebrow="YOU University" title="Train the mental game" description="One short skill. One real use in practice or competition. No course dump." />
      <Card tone="dark" className="university-hero">
        <div className="university-hero__mark"><Icon name="book" size={30}/></div>
        <div className="eyebrow eyebrow--light">Your toolkit</div>
        <h2>{completeIds.size} skills completed</h2>
        <p>Progress means you can use the skill, not that you tapped through a lesson.</p>
        <ProgressBar value={percent} />
        {next ? <button className="university-next" type="button" onClick={() => navigate(ROUTES.lesson(next.id))}><span><small>Next skill · Week {next.week}</small><strong>{next.title}</strong></span><Icon name="arrow"/></button> : null}
      </Card>

      <div className="lesson-list">
        {bundle.curriculum.map((lesson) => {
          const complete = completeIds.has(lesson.id);
          const applied = appliedIds.has(lesson.id);
          return (
            <Link className={`lesson-row ${complete ? "is-complete" : ""}`} key={lesson.id} to={ROUTES.lesson(lesson.id)}>
              <span className="lesson-row__number">{complete ? <Icon name="check"/> : lesson.week}</span>
              <span className="lesson-row__copy"><small>Week {lesson.week}</small><strong>{lesson.title}</strong><span>{lesson.useItToday}</span></span>
              <span className="lesson-row__status">{complete ? <Tag tone="green">Complete</Tag> : applied ? <Tag tone="blue">Applied</Tag> : <Icon name="chevron"/>}</span>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader eyebrow="The point" title="Put the phone away and use it" />
        <p className="large-copy">Every lesson ends with something you can do in a real practice or match. The app helps prepare the skill; wrestling is where you build it.</p>
      </Card>
    </div>
  );
}
