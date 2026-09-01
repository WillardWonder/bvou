import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const handler = (current: Event) => {
      current.preventDefault();
      setEvent(current as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  return {
    canInstall: Boolean(event),
    install: async () => {
      if (!event) return false;
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") setEvent(null);
      return choice.outcome === "accepted";
    },
  };
}
