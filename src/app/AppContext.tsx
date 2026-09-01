import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthSession, Role } from "../domain";
import { env } from "../config/env";
import type { AppBundle, AppGateway } from "../data/gateway";
import { DemoGateway } from "../data/demoGateway";
import { FirebaseGateway } from "../data/firebaseGateway";
import { messageForError } from "../utils/errors";

export interface Notice {
  id: number;
  message: string;
  tone: "success" | "info" | "warning" | "error";
}

interface AppContextValue {
  gateway: AppGateway;
  session: AuthSession | null;
  bundle: AppBundle | null;
  authLoading: boolean;
  dataLoading: boolean;
  online: boolean;
  error: string | null;
  notice: Notice | null;
  signInEmail(email: string, password: string): Promise<void>;
  signInGoogle(): Promise<void>;
  signInDemo(role: Role): Promise<void>;
  signOut(): Promise<void>;
  completeOnboarding(): Promise<void>;
  refresh(options?: { quiet?: boolean }): Promise<void>;
  announce(message: string, tone?: Notice["tone"]): void;
  clearError(): void;
}

const AppContext = createContext<AppContextValue | null>(null);
const gateway: AppGateway = env.dataMode === "firebase" ? new FirebaseGateway() : new DemoGateway();

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [bundle, setBundle] = useState<AppBundle | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeId = useRef(0);

  const announce = useCallback((message: string, tone: Notice["tone"] = "success") => {
    noticeId.current += 1;
    setNotice({ id: noticeId.current, message, tone });
  }, []);

  const refresh = useCallback(async (options?: { quiet?: boolean }) => {
    if (!session) {
      setBundle(null);
      return;
    }
    if (!options?.quiet) setDataLoading(true);
    try {
      const loaded = await gateway.loadBundle(session);
      setBundle(loaded);
      setError(null);
    } catch (caught) {
      setError(messageForError(caught));
    } finally {
      if (!options?.quiet) setDataLoading(false);
    }
  }, [session]);

  useEffect(() => gateway.subscribeAuth((next) => {
    setSession(next);
    setAuthLoading(false);
    if (!next) setBundle(null);
  }), []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!session) return;
    return gateway.subscribeCurrentPractice(session, (practice) => {
      setBundle((current) => current ? { ...current, currentSession: practice } : current);
    });
  }, [session]);

  useEffect(() => {
    if (!session || !bundle?.currentSession) return;
    return gateway.subscribeBoardEntries(session.teamId, bundle.currentSession.id, (entries) => {
      setBundle((current) => current ? { ...current, boardEntries: entries } : current);
    });
  }, [session, bundle?.currentSession?.id]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice((current) => current?.id === notice.id ? null : current), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const next = await gateway.signInEmail({ email, password });
      setSession(next);
      setError(null);
    } catch (caught) {
      setError(messageForError(caught, "Sign-in failed."));
      throw caught;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    setAuthLoading(true);
    try {
      const next = await gateway.signInGoogle();
      setSession(next);
      setError(null);
    } catch (caught) {
      setError(messageForError(caught, "Google sign-in failed."));
      throw caught;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signInDemo = useCallback(async (role: Role) => {
    setAuthLoading(true);
    try {
      const next = await gateway.signInDemo(role);
      setSession(next);
      setError(null);
    } catch (caught) {
      setError(messageForError(caught));
      throw caught;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await gateway.signOut();
    setSession(null);
    setBundle(null);
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!session) return;
    const profile = await gateway.completeOnboarding(session);
    setSession({ ...session, profile });
    announce("You are ready. Let's build your wrestling.");
  }, [session, announce]);

  const value = useMemo<AppContextValue>(() => ({
    gateway,
    session,
    bundle,
    authLoading,
    dataLoading,
    online,
    error,
    notice,
    signInEmail,
    signInGoogle,
    signInDemo,
    signOut,
    completeOnboarding,
    refresh,
    announce,
    clearError: () => setError(null),
  }), [session, bundle, authLoading, dataLoading, online, error, notice, signInEmail, signInGoogle, signInDemo, signOut, completeOnboarding, refresh, announce]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider.");
  return value;
}
