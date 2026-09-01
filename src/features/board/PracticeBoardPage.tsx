import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import type { BoardEntry } from "../../domain";
import { useApp } from "../../app/AppContext";
import { BrandMark } from "../../components/BrandMark";
import { Icon } from "../../components/Icon";

interface WakeLockSentinelLike { release(): Promise<void>; }

export function PracticeBoardPage() {
  const { teamId, sessionId } = useParams();
  const { bundle, gateway, online } = useApp();
  const [entries, setEntries] = useState<BoardEntry[]>(bundle?.currentSession?.id === sessionId ? bundle.boardEntries : []);
  const [now, setNow] = useState(new Date());
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const wakeLock = useRef<WakeLockSentinelLike | null>(null);
  const practice = bundle?.currentSession?.id === sessionId ? bundle.currentSession : bundle?.currentSession;

  useEffect(() => {
    if (!teamId || !sessionId) return;
    return gateway.subscribeBoardEntries(teamId, sessionId, setEntries);
  }, [gateway, teamId, sessionId]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const change = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<WakeLockSentinelLike> } };
    if (nav.wakeLock) void nav.wakeLock.request("screen").then((value) => { wakeLock.current = value; }).catch(() => undefined);
    return () => { void wakeLock.current?.release(); };
  }, []);

  const sorted = useMemo(() => [...entries].sort((a, b) => Number(b.state === "ready") - Number(a.state === "ready") || a.boardDisplayName.localeCompare(b.boardDisplayName)), [entries]);
  const ready = sorted.filter((item) => item.state === "ready").length;
  const columns = sorted.length <= 8 ? 2 : sorted.length <= 15 ? 3 : 4;
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen();
  };

  return (
    <main className="practice-board" style={{ "--board-columns": columns } as React.CSSProperties}>
      <header className="practice-board__header">
        <div className="practice-board__brand"><BrandMark compact/><span><strong>Today's 1%</strong><small>Merrill Girls Wrestling</small></span></div>
        <div className="practice-board__theme"><small>Room focus</small><strong>{practice?.teamTheme || "Own the next exchange"}</strong></div>
        <div className="practice-board__controls"><span className={online ? "board-online" : "board-offline"}>{online ? "Live" : "Offline"}</span><strong>{now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</strong><button type="button" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}><Icon name={fullscreen ? "close" : "signal"}/></button></div>
      </header>

      <section className="practice-board__grid">
        {sorted.map((entry, index) => <article key={entry.athleteUid} className={`board-tile ${entry.state === "ready" ? "is-ready" : "is-pending"}`} style={{ "--tile-delay": `${Math.min(index * 35, 350)}ms` } as React.CSSProperties}>
          <div className="board-tile__top"><strong>{entry.boardDisplayName}</strong>{entry.pillar ? <span>{entry.pillar}</span> : null}</div>
          <div className="board-tile__focus">{entry.state === "ready" ? entry.focusText : "FOCUS NOT SET"}</div>
          <div className="board-tile__state">{entry.reflectionComplete ? <><Icon name="check" size={17}/> Loop closed</> : entry.state === "ready" ? "Ready to coach" : "Waiting"}</div>
        </article>)}
      </section>

      <footer className="practice-board__footer"><span>{ready} focuses ready</span><strong>KEEP WRESTLING · EVERY DAY IS A NEW MATCH</strong><span>Private reflections stay private</span></footer>
    </main>
  );
}
