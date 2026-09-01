import { useCallback, useState } from "react";
import { messageForError } from "../utils/errors";

export function useBusyAction() {
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setLocalError(null);
    try {
      return await action();
    } catch (error) {
      setLocalError(messageForError(error));
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, localError, setLocalError, run };
}
