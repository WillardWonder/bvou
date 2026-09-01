import { useState, type FormEvent } from "react";
import { DEFAULT_SEASON_ID, type Membership, type Role } from "../../domain";
import { useApp } from "../../app/AppContext";
import { Button } from "../../components/Button";
import { Card, CardHeader } from "../../components/Card";
import { Tag } from "../../components/Chip";
import { Field, Input, Select } from "../../components/Form";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { InlineStatus } from "../../components/Status";
import { useBusyAction } from "../../hooks/useBusyAction";

export function AdminPage() {
  const { session, bundle, gateway, refresh, announce, signOut } = useApp();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [boardName, setBoardName] = useState("");
  const [role, setRole] = useState<Exclude<Role, "board">>("athlete");
  const { busy, localError, run } = useBusyAction();
  if (!session || !bundle) return null;
  const diagnostics = gateway.diagnostics();
  const isAdmin = session.membership.role === "admin";

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() => gateway.saveInvite(session, {
      email,
      displayName,
      boardDisplayName: boardName || displayName.split(" ")[0] || "Athlete",
      role,
      seasonId: bundle.season.id,
      active: true,
    }));
    if (!result) return;
    await refresh({ quiet: true }); setInviteOpen(false); setEmail(""); setDisplayName(""); setBoardName(""); announce("Invitation saved. That email can claim the team account at sign-in.");
  };
  const toggleActive = async (member: Membership) => {
    const result = await run(() => gateway.saveMembership(session, { ...member, active: !member.active }));
    if (!result) return; await refresh({ quiet: true }); announce(`${member.boardDisplayName} is now ${result.active ? "active" : "inactive"}.`);
  };
  const exportData = async () => {
    const value = await run(() => gateway.exportSeason(session));
    if (!value) return;
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `merrill-girls-wrestling-${bundle.season.id}-export.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    announce("Season export downloaded.");
  };

  return (
    <div className="page page--coach">
      <PageHeader eyebrow="Admin" title="Team access and system health" description="Keep access narrow, content coach-approved, and athlete-private data out of public views." />

      <Card tone="dark" className="account-card">
        <div className="account-card__avatar">{session.displayName.charAt(0)}</div>
        <div><div className="eyebrow eyebrow--light">Signed in as {session.membership.role}</div><h2>{session.displayName}</h2><p>{session.email}</p></div>
        <Button variant="secondary" size="sm" icon="logout" onClick={() => void signOut()}>Sign out</Button>
      </Card>

      <Card>
        <CardHeader eyebrow="System" title="Deployment diagnostics" />
        <div className="diagnostic-grid">
          <Diagnostic label="Data mode" value={diagnostics.dataMode} tone={diagnostics.dataMode === "firebase" ? "green" : "blue"}/>
          <Diagnostic label="Project" value={diagnostics.firebaseProjectId || "not configured"}/>
          <Diagnostic label="Network" value={diagnostics.online ? "online" : "offline"} tone={diagnostics.online ? "green" : "red"}/>
          <Diagnostic label="App Check" value={diagnostics.appCheckConfigured ? "configured" : "not configured"} tone={diagnostics.appCheckConfigured ? "green" : "default"}/>
          <Diagnostic label="Emulators" value={diagnostics.emulatorMode ? "on" : "off"}/>
          <Diagnostic label="Build" value={diagnostics.buildSha.slice(0, 10)}/>
        </div>
        {diagnostics.dataMode === "demo" ? <InlineStatus tone="info">Demo mode stores synthetic data in this browser. Switch VITE_DATA_MODE to firebase for the real team deployment.</InlineStatus> : null}
        {!diagnostics.appCheckConfigured && diagnostics.dataMode === "firebase" ? <InlineStatus tone="warning">Configure and monitor App Check before enforcing it in production.</InlineStatus> : null}
      </Card>

      {isAdmin ? (
        <>
          <Card>
            <CardHeader eyebrow="Access" title="Active team members" action={<Button size="sm" icon="plus" onClick={() => setInviteOpen(true)}>Invite</Button>} />
            <div className="member-list">
              {bundle.memberships.map((member) => <div className="member-row" key={member.uid}><span className="member-row__avatar">{member.boardDisplayName.charAt(0)}</span><span className="member-row__copy"><strong>{member.displayName}</strong><small>{member.email || member.uid}</small></span><Tag tone={member.role === "admin" ? "red" : member.role === "coach" ? "blue" : "default"}>{member.role}</Tag><button type="button" className={`switch ${member.active ? "is-on" : ""}`} onClick={() => void toggleActive(member)} aria-label={`${member.active ? "Deactivate" : "Activate"} ${member.displayName}`}><span/></button></div>)}
            </div>
          </Card>

          {bundle.invites.length ? <Card><CardHeader eyebrow="Pending access" title="Email invitations"/>{bundle.invites.map((invite) => <div className="member-row" key={invite.id}><span className="member-row__avatar"><Icon name="users" size={18}/></span><span className="member-row__copy"><strong>{invite.displayName}</strong><small>{invite.email}</small></span><Tag tone={invite.active ? "blue" : "default"}>{invite.active ? "waiting" : "claimed"}</Tag></div>)}</Card> : null}

          <Card>
            <CardHeader eyebrow="Data lifecycle" title="Export and retain intentionally" />
            <p className="large-copy">Download a structured season backup for controlled archiving or transition. Do not place real athlete exports in GitHub.</p>
            <Button variant="secondary" icon="download" onClick={() => void exportData()} loading={busy}>Export active season</Button>
          </Card>
        </>
      ) : <InlineStatus tone="info">Coach accounts can run practice and manage approved content. Roster access and exports require the admin role.</InlineStatus>}

      <Card>
        <CardHeader eyebrow="Production checklist" title="Before real athlete use" />
        <div className="checklist">
          <label><input type="checkbox" readOnly checked={diagnostics.dataMode === "firebase"}/><span>Firebase production mode</span></label>
          <label><input type="checkbox" readOnly checked={diagnostics.appCheckConfigured}/><span>App Check configured and monitored</span></label>
          <label><input type="checkbox" readOnly/><span>Google and/or email sign-in enabled in Firebase Console</span></label>
          <label><input type="checkbox" readOnly/><span>Firestore rules and rules tests deployed</span></label>
          <label><input type="checkbox" readOnly/><span>Real roster and consent process approved</span></label>
          <label><input type="checkbox" readOnly/><span>Coach pilot completed on actual phones and room display</span></label>
        </div>
      </Card>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a team member" footer={<><Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button><Button type="submit" form="invite-form" loading={busy}>Save invitation</Button></>}>
        {localError ? <InlineStatus tone="error">{localError}</InlineStatus> : null}
        <form id="invite-form" className="stack" onSubmit={invite}><Field label="Email"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required/></Field><Field label="Full display name"><Input value={displayName} onChange={(event) => { setDisplayName(event.target.value); if (!boardName) setBoardName(event.target.value.split(" ")[0] || ""); }} required/></Field><Field label="Practice Board name"><Input value={boardName} onChange={(event) => setBoardName(event.target.value)} required maxLength={40}/></Field><Field label="Role"><Select value={role} onChange={(event) => setRole(event.target.value as Exclude<Role, "board">)}><option value="athlete">Athlete</option><option value="coach">Coach</option><option value="admin">Program admin</option></Select></Field><input type="hidden" value={DEFAULT_SEASON_ID}/></form>
      </Modal>
    </div>
  );
}

function Diagnostic({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "blue" | "red" | "green" }) {
  return <div><span>{label}</span><Tag tone={tone}>{value}</Tag></div>;
}
