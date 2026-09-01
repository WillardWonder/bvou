import { BRAND } from "../domain";

export function BrandMark({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <img
      className={`brand-mark ${compact ? "brand-mark--compact" : ""} ${className}`}
      src={compact ? BRAND.compactLogo : BRAND.primaryLogo}
      alt="Merrill Girls Wrestling"
    />
  );
}
