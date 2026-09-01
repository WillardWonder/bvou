import type { ConfidenceEvidence } from "../domain";
import { formatDate } from "../utils/date";
import { Icon } from "./Icon";
import { Tag } from "./Chip";

export function EvidenceCard({ item, onPin, onArchive, compact = false }: { item: ConfidenceEvidence; onPin?(): void; onArchive?(): void; compact?: boolean }) {
  return (
    <article className={`evidence-card ${compact ? "evidence-card--compact" : ""}`}>
      <div className="evidence-card__quote">“{item.text}”</div>
      <div className="evidence-card__meta">
        <span>{item.contextLabel || item.source} · {formatDate(item.occurredAt, { month: "short", day: "numeric" })}</span>
        {item.sourceAuthorName ? <span>From {item.sourceAuthorName}</span> : null}
      </div>
      <div className="evidence-card__foot">
        <div className="tag-row">
          {item.pillar ? <Tag tone="blue">{item.pillar}</Tag> : null}
          {item.tags.slice(0, 2).map((tag) => <Tag key={tag}>{tag}</Tag>)}
        </div>
        {(onPin || onArchive) ? <div className="evidence-card__actions">
          {onPin ? <button type="button" className={`icon-button icon-button--small ${item.pinned ? "is-active" : ""}`} onClick={onPin} aria-label={item.pinned ? "Unpin evidence" : "Pin evidence"}><Icon name="pin" size={17}/></button> : null}
          {onArchive ? <button type="button" className="text-button" onClick={onArchive}>Archive</button> : null}
        </div> : null}
      </div>
    </article>
  );
}
