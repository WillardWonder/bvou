import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  iconAfter?: IconName;
  full?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "primary", size = "md", icon, iconAfter, full, loading, disabled, className = "", children, ...props
}, ref) {
  return (
    <button ref={ref} className={`button button--${variant} button--${size} ${full ? "button--full" : ""} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? <span className="button__spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={size === "sm" ? 17 : 20} /> : null}
      <span>{loading ? "Working..." : children}</span>
      {iconAfter && !loading ? <Icon name={iconAfter} size={size === "sm" ? 17 : 20} /> : null}
    </button>
  );
});
