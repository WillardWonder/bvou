import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function InlineStatus({ tone = "info", children }: { tone?: "info" | "success" | "warning" | "error"; children: ReactNode }) {
  return <div className={`inline-status inline-status--${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export function LoadingView({ label = "Loading your wrestling..." }: { label?: string }) {
  return <div className="loading-view" role="status"><span className="loading-orbit" aria-hidden="true"/><p>{label}</p></div>;
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-state__mark"><Icon name="spark" size={25}/></div><h2>{title}</h2><p>{text}</p>{action}</div>;
}
