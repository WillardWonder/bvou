import { useApp } from "../app/AppContext";
import { Icon } from "./Icon";

export function GlobalFeedback() {
  const { error, clearError, notice } = useApp();
  return (
    <div className="feedback-stack" aria-live="polite">
      {error ? <div className="toast toast--error" role="alert"><span>{error}</span><button type="button" onClick={clearError} aria-label="Dismiss error"><Icon name="close" size={18}/></button></div> : null}
      {notice ? <div className={`toast toast--${notice.tone}`}><Icon name={notice.tone === "success" ? "check" : "spark"} size={18}/><span>{notice.message}</span></div> : null}
    </div>
  );
}
