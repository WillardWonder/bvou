import type { HTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "", tone = "default", ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode; tone?: "default" | "blue" | "dark" | "soft" | "red" }) {
  return <section className={`card card--${tone} ${className}`} {...props}>{children}</section>;
}

export function CardHeader({ eyebrow, title, action, children }: { eyebrow?: string; title: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <header className="card__header">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h2 className="card__title">{title}</h2>
        {children ? <div className="card__subtitle">{children}</div> : null}
      </div>
      {action ? <div className="card__action">{action}</div> : null}
    </header>
  );
}
