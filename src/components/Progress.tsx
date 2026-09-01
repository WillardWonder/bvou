export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const percent = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="progress-wrap">
      {label ? <div className="progress-label"><span>{label}</span><strong>{Math.round(percent)}%</strong></div> : null}
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><span style={{ width: `${percent}%` }} /></div>
    </div>
  );
}
