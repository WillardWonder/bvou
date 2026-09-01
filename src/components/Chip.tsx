import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Chip({ selected, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean; children: ReactNode }) {
  return <button type="button" className={`chip ${selected ? "chip--selected" : ""} ${className}`} aria-pressed={selected} {...props}>{children}</button>;
}

export function Tag({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "blue" | "red" | "dark" | "green" }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}
