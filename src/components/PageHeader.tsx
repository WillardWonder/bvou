import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon";

export function PageHeader({ title, eyebrow, description, back, action }: { title: string; eyebrow?: string; description?: string; back?: boolean; action?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      <div className="page-header__top">
        {back ? <button className="icon-button" type="button" aria-label="Go back" onClick={() => navigate(-1)}><Icon name="back" /></button> : null}
        <div className="page-header__copy">
          {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
          <h1>{title}</h1>
        </div>
        {action ? <div className="page-header__action">{action}</div> : null}
      </div>
      {description ? <p>{description}</p> : null}
    </header>
  );
}
