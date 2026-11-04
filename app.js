/* YOU University Lab — Merrill Bluejays Wrestling. All data stays in this browser (localStorage). */
(() => {
const D = window.YOU, U = D.units;
const KEY = "youu-lab-v1";
const blank = () => ({ f: {}, prog: {}, rev: {}, logs: [], films: [], deposits: [], mats: {}, well: {}, goals: {} });
let S; try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { S = blank(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} CLOUD.push(); };
/* ---------- cloud sync (Firebase). Falls back to this-device-only if not configured. ---------- */
const CFG = window.YOU_FIREBASE, OWNER = "stutting.josh@gmail.com"; let COACHES = [OWNER];
const CLOUD = { on: false, user: null, db: null, t: null, status: "",
  ready: !!(CFG && window.firebase && CFG.apiKey && !/PASTE/.test(CFG.apiKey)),
  isCoach() { return !!this.user && COACHES.includes((this.user.email || "").toLowerCase()); },
  isOwner() { return !!this.user && (this.user.email || "").toLowerCase() === OWNER; },
  async loadCoaches() { try { const q = await this.db.collection("youuCoaches").get(); COACHES = [OWNER, ...q.docs.map(d => d.id.toLowerCase())]; } catch (e) {} },
  async allowed(u) { const e = (u.email || "").toLowerCase(); if (!u.emailVerified) return false; if (/@mapsedu\.org$/.test(e) || COACHES.includes(e)) return true;
    try { return (await this.db.collection("youuInvites").doc(e).get()).exists; } catch (x) { return false; } },
  push() { if (!this.on) return; clearTimeout(this.t); this.setStatus("saving…"); this.t = setTimeout(() => {
    this.db.collection("youu").doc(this.user.uid).set({ email: this.user.email, name: this.user.displayName || this.user.email, updatedAt: Date.now(), state: JSON.parse(JSON.stringify(S)) })
      .then(() => this.setStatus("saved ✓")).catch(e => this.setStatus("saved on device · will sync")); }, 1200); },
  setStatus(s) { this.status = s; const w = document.getElementById("who"); if (w && this.user) w.textContent = (this.user.displayName || this.user.email).split(" ")[0] + " · " + s; }
};
const $ = (q, el = document) => el.querySelector(q), $$ = (q, el = document) => [...el.querySelectorAll(q)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const app = $("#app");
const toast = m => { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("show"), 1600); };
const today = () => new Date().toISOString().slice(0, 10);
const DAY = 864e5;
const CLEAN = [];

/* ---------- generic field binding: any [data-k] input persists ---------- */
function bind(root = app) {
  $$("[data-k]", root).forEach(el => {
    const k = el.dataset.k;
    if (el.type === "checkbox") el.checked = !!S.f[k]; else if (S.f[k] !== undefined) el.value = S.f[k];
    el.addEventListener("input", () => { S.f[k] = el.type === "checkbox" ? el.checked : el.value; save(); root.dispatchEvent(new CustomEvent("fieldchange", { detail: k })); });
  });
}
const F = k => (S.f[k] || "").trim();
const ta = (k, ph = "", rows = 3) => `<textarea data-k="${k}" rows="${rows}" placeholder="${esc(ph)}"></textarea>`;
const inp = (k, ph = "") => `<input type="text" data-k="${k}" placeholder="${esc(ph)}">`;

/* ---------- badges / sources ---------- */
const SRC = Object.assign({}, D.book, D.sci);
const src = keys => keys.split(" ").map(k => `<span class="src" title="${esc(SRC[k] || "")}" data-src="${k}">[${k}]</span>`).join(" ");
const badge = t => ({ BOOK: '<span class="badge b-book">From the book</span>', SCI: '<span class="badge b-sci">The science</span>', MER: '<span class="badge b-mer">Merrill</span>', YOU: '<span class="badge b-you">YOU University original</span>' }[t]);
document.addEventListener("click", e => { const s = e.target.closest("[data-src]"); if (s) toast(SRC[s.dataset.src]?.slice(0, 140) + "…"); });

/* ---------- progress ---------- */
const P = n => (S.prog[n] = S.prog[n] || { learn: 0, build: 0, mat: 0, match: 0 });
const pct = () => { let t = 0; U.forEach(u => { const p = P(u.n); t += ["learn", "build", "mat", "match"].filter(x => p[x]).length; }); return Math.round(100 * t / (U.length * 4)); };
function mark(n, step) { if (!P(n)[step]) { P(n)[step] = 1; save(); toast("1% better ✓"); } }

/* ---------- spaced review (Leitner: 1, 3, 7, 14, 30 days) ---------- */
const BOX = [0, 1, 3, 7, 14, 30];
const allCards = () => U.flatMap(u => u.quiz.map((c, i) => ({ id: `${u.n}-${i}`, n: u.n, ...c })));
function unlock(n) { U.find(u => u.n === n).quiz.forEach((c, i) => { const id = `${n}-${i}`; if (!S.rev[id]) S.rev[id] = { box: 1, due: Date.now() + DAY }; }); save(); }
const due = () => allCards().filter(c => S.rev[c.id] && S.rev[c.id].due <= Date.now());
function grade(id, g) { const r = S.rev[id]; r.box = g === 2 ? Math.min(5, r.box + 1) : g === 1 ? r.box : 1; r.due = Date.now() + BOX[r.box] * DAY * (g === 0 ? 0.0001 : 1); save(); }
function dot() { const d = due().length, el = $("#dueDot"); el.hidden = !d; el.textContent = d; }

/* ---------- views ---------- */
const V = {};
V.home = () => {
  const d = due().length;
  app.innerHTML = `
  <div class="hero"><img src="bluejay.png" alt=""><div class="kick">Merrill Bluejays Wrestling</div><div class="you">YOU</div><div class="uni">UNIVERSITY</div>
  <p class="hook" style="max-width:420px;margin-top:10px">Train the part of wrestling nobody sees from the bleachers. Built to go with <i>WINNING STATE Wrestling</i> by Steve Knight.</p></div>
  <div class="grid stats" style="margin-top:12px">
   <div class="stat"><b>${pct()}%</b><span>Skill Ladder</span></div>
   <div class="stat"><b>${d}</b><span>Rewind due ${d ? "→ <a href='#review'>go</a>" : ""}</span></div>
   <div class="stat"><b>${S.logs.length + S.films.length}</b><span>logs</span></div>
  </div>
  ${checked(today()) ? `<a class="card" href="#daily" style="display:block;text-decoration:none;color:inherit;border-color:var(--ok)">✓ <b>Checked in today.</b> <span class="muted">Consistency run: ${consistency()} days</span></a>` : `<a class="card" href="#daily" style="display:block;text-decoration:none;color:inherit;border-color:var(--warn)"><div class="kick" style="color:var(--warn)">15-second check-in</div><b>Water, food, sleep: tap in today →</b><div class="small muted">Consistency run: ${consistency()} days. Never miss twice.</div></a>`}
  <div class="card"><div class="kick">Today's 1%</div><label class="l">One specific, controllable behavior for today's practice</label>${inp("today1", "e.g., Be first to ties every live go")}
   <div class="small muted" style="margin-top:6px">Make it a verb + a wrestling behavior + when. "Stay in good stance through the whole live go" works. "Be better" doesn't.</div></div>
  <div class="row"><a class="btn ghost sm" href="#card">My Competition Card</a><a class="btn ghost sm" href="#manual">What Works for Me</a></div>
  <h2>The Season Map</h2><p class="muted small" style="margin-top:-4px">Each unit builds on the last. Green bars: Learn → Build → Mat Test → Used in a match.</p>
  <div class="units">${U.map(u => { const p = P(u.n); return `<a class="u" href="#unit/${u.n}"><span class="n">${u.n}</span><b>${esc(u.title)}</b><i>${esc(u.hook)}</i><div class="ladder">${["learn", "build", "mat", "match"].map(x => `<span class="${p[x] ? "on" : ""}"></span>`).join("")}</div></a>`; }).join("")}
   <a class="u" href="#manual" style="border-color:#7a2235"><span class="n" style="background:var(--red)">★</span><b>Be You</b><i>Your "What Works for Me" manual, built from your own tools</i></a></div>
  <div class="card"><div class="kick">How it works</div><div class="grid g2 small" style="margin-top:8px">
   <div><b>1 Learn.</b> Read the book section, then the Learn tab. Answer the Match Moment before you read on.</div>
   <div><b>2 Build.</b> Make your tool in your own words. It saves on this device.</div>
   <div><b>3 Mat Test.</b> Choose A or B and try it in a real drill. Log what happened.</div>
   <div><b>4 Rewind.</b> Cards come back after 1, 3, 7, 14 days. Recall first, then check. That's how it sticks.</div></div>
   <p class="small muted" style="margin:10px 0 0">Private by design: no accounts, nothing uploaded. Your answers live only in this browser. Back them up from <a href="#data">Data</a>.</p>
   <a class="btn ghost sm" href="YOU_University_Mental_Game_Workbook.pdf" target="_blank" rel="noopener" style="margin-top:10px;display:inline-block">Download the printable workbook (PDF)</a></div>`;
  bind();
};

V.unit = (n, tab = "learn") => {
  const u = U.find(x => x.n === +n); if (!u) return V.home();
  const tabs = [["learn", "Learn"], ["build", "Build"], ["mat", "Mat Test"], ["rewind", "Rewind"]];
  app.innerHTML = `<div class="kick" style="margin-top:16px">Unit ${u.n} · ${esc(u.merrill_tag)}</div><h1>${esc(u.title)}</h1><p class="hook">${esc(u.hook)}</p>
   <div class="subtabs">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? "on" : ""}">${l}</button>`).join("")}</div><div id="tabBody"></div>
   <div class="row" style="margin-top:18px">${u.n > 1 ? `<a class="btn ghost sm" href="#unit/${u.n - 1}">← Unit ${u.n - 1}</a>` : ""}<span class="sp"></span>${u.n < 7 ? `<a class="btn ghost sm" href="#unit/${u.n + 1}">Unit ${u.n + 1} →</a>` : `<a class="btn ghost sm" href="#manual">Be You →</a>`}</div>`;
  $$(".subtabs button").forEach(b => b.onclick = () => { location.hash = `#unit/${u.n}/${b.dataset.tab}`; });
  const body = $("#tabBody");
  ({ learn: learnTab, build: buildTab, mat: matTab, rewind: rewindTab })[tab](u, body);
  bind(body);
};

function learnTab(u, el) {
  el.innerHTML = `
  <div class="card moment"><div class="kick" style="color:#ff6b84">Match Moment</div><p style="font-size:17px">${esc(u.moment)}</p>
   <label class="l">Before you read on: what would YOU do in the next 5 seconds?</label>${ta(`m${u.n}`, "Be honest. There's no wrong answer here.", 2)}
   <button class="btn sm" id="rv" style="margin-top:8px">Show me the skill</button></div>
  <div class="reveal" id="rvBody">
   <div class="card"><div class="kick">Skill you'll own</div><div style="font-weight:800;font-size:17px">${esc(u.skill)}</div></div>
   <div class="card">${badge("BOOK")}<p>${esc(u.book.text)} ${src(u.book.src)}</p>
    <div class="grid g2"><div><label class="l">Find it in your copy (chapter / page)</label>${inp(`ch${u.n}`, "Ch. __, p. __")}</div><div><label class="l">One line that stuck with you, in your own words</label>${inp(`line${u.n}`)}</div></div></div>
   <div class="grid g2"><div class="card">${badge("SCI")}<p>${esc(u.science.text)} ${src(u.science.src)}</p></div><div class="card">${badge("MER")}<p>${esc(u.merrill)}</p></div></div>
   <div class="card"><div class="kick">Quick check · recall, then reveal</div>${u.quiz.map((q, i) => `<div style="margin-top:10px"><b>${esc(q.q)}</b><div class="row" style="margin-top:6px"><button class="btn ghost sm" data-show="${i}">Reveal</button></div><div class="reveal small" id="qa${i}" style="color:#bfe8d6;margin-top:6px">${esc(q.a)}</div></div>`).join("")}</div>
   <button class="btn" id="lDone">I've got it. Build my tool →</button></div>`;
  const show = () => { $("#rvBody", el).classList.add("show"); $("#rv", el).hidden = true; };
  $("#rv", el).onclick = () => { if (!F(`m${u.n}`)) { toast("Write your answer first. Guessing first helps you learn."); return; } show(); };
  if (F(`m${u.n}`)) show();
  $$("[data-show]", el).forEach(b => b.onclick = () => $("#qa" + b.dataset.show, el).classList.add("show"));
  $("#lDone", el).onclick = () => { mark(u.n, "learn"); unlock(u.n); dot(); location.hash = `#unit/${u.n}/build`; };
}

/* ---------- unit tools ---------- */
const TOOLS = {
 warrior(u, el) {
  const rows = u.gap_rows.map((r, i) => ({ i, r }));
  el.innerHTML = `<p>${esc(u.tool_intro)}</p>
  <table class="t"><tr><th>Skill</th><th>Practice-me</th><th>Match-me</th></tr>${rows.map(({ i, r }) => `<tr><td>${r ? esc(r) : inp("gapname" + i, "My own skill")}</td><td><input type="range" min="1" max="5" step="1" data-k="gp${i}" value="3"></td><td><input type="range" min="1" max="5" step="1" data-k="gm${i}" value="3"></td></tr>`).join("")}</table>
  <div class="bars" id="bars"></div><div class="legend"><span><i class="sw" style="background:var(--blue)"></i>Practice-me</span><span><i class="sw" style="background:var(--red)"></i>Match-me</span><span><i class="sw" style="outline:2px dashed var(--warn)"></i>Biggest gap</span></div>
  <p id="gapMsg" class="small" style="margin-top:8px"></p>
  ${u.tool_prompts.map((p, i) => `<label class="l">${esc(p[0])}</label>${ta(`t1_${i}`)}`).join("")}`;
  const draw = () => {
    let best = -1, bi = -1;
    $("#bars", el).innerHTML = rows.map(({ i }) => { const p = +(S.f["gp" + i] || 3), m = +(S.f["gm" + i] || 3); if (p - m > best) { best = p - m; bi = i; } return `<div class="b" data-i="${i}"><div style="height:${p * 20}%;background:var(--blue)"></div><div style="height:${m * 20}%;background:var(--red)"></div></div>`; }).join("");
    const b = $(`.b[data-i="${bi}"]`, el); if (best > 0 && b) b.classList.add("gapmax");
    const name = u.gap_rows[bi] || F("gapname" + bi) || "your own skill";
    $("#gapMsg", el).innerHTML = best > 0 ? `Biggest gap: <b>${esc(name)}</b> (${best} point${best > 1 ? "s" : ""}). That's a strong candidate for Today's 1%.` : "Move the sliders. Be honest about matches, not just practice.";
  };
  el.addEventListener("fieldchange", draw); draw();
 },
 nerves(u, el) {
  el.innerHTML = `<p>${esc(u.tool_intro)}</p>
  <table class="t"><tr><th>Body signal</th><th>little-dog story</th><th>Fuel translation</th></tr>
  <tr><td class="small">Heart pounding</td><td class="small muted">"I'm freaking out."</td><td class="small" style="color:#bfe8d6">"My body is sending blood to my muscles."</td></tr>
  ${[1, 2, 3].map(i => `<tr><td>${inp("sig" + i, "signal")}</td><td>${inp("sto" + i, "story")}</td><td>${inp("fue" + i, "fuel")}</td></tr>`).join("")}</table>
  <h3>My Ready Zone</h3><div class="dial" id="dial"><div class="mk" id="mkU"></div><div class="mk best" id="mkB"></div></div>
  <div class="row small muted"><span>0 FLAT</span><span class="sp"></span><span>READY</span><span class="sp"></span><span>OVERLOAD 10</span></div>
  <label class="l">My usual bullpen number: <b id="vU"></b></label><input type="range" min="0" max="10" data-k="dialU" value="5">
  <label class="l">My best-match number: <b id="vB"></b></label><input type="range" min="0" max="10" data-k="dialB" value="5">
  ${u.tool_prompts.map((p, i) => `<label class="l">${esc(p[0])}</label>${ta(`t2_${i}`)}`).join("")}`;
  const draw = () => { const a = +(S.f.dialU ?? 5), b = +(S.f.dialB ?? 5); $("#mkU", el).style.left = a * 10 + "%"; $("#mkB", el).style.left = b * 10 + "%"; $("#vU", el).textContent = a; $("#vB", el).textContent = b + (a !== b ? (a > b ? "  → you usually need a down-shift" : "  → you usually need an up-shift") : "  → you usually walk out ready"); };
  el.addEventListener("fieldchange", draw); draw();
 },
 breath(u, el) {
  el.innerHTML = `<p>${esc(u.tool_intro)} Use the <a href="#breathe">Breathe</a> pacer for the tool itself.</p>
  <table class="t"><tr><th>Trial</th><th>Breaths/30s before</th><th>after</th><th>Feeling 0-10 before</th><th>after</th></tr>
  ${u.lab_rows.map((r, i) => `<tr><td class="small">${esc(r)}</td>${["bb", "ba", "fb", "fa"].map(x => `<td><input type="number" min="0" max="60" data-k="${x}${i}"></td>`).join("")}</tr>`).join("")}</table>
  <p id="labMsg" class="small" style="margin-top:8px"></p>
  ${u.tool_prompts.map((p, i) => `<label class="l">${esc(p[0])}</label>${ta(`t3_${i}`)}`).join("")}`;
  const draw = () => { const out = u.lab_rows.map((r, i) => { const b = +S.f["bb" + i], a = +S.f["ba" + i]; return b && a ? `${r}: ${b} → ${a} breaths (${a < b ? "slower ✓" : a > b ? "faster" : "no change"})` : null; }).filter(Boolean); $("#labMsg", el).innerHTML = out.length ? out.join("<br>") + "<br><span class='muted'>No change? That's data. Try a slower exhale and test again.</span>" : "<span class='muted'>Enter your numbers to see what changed.</span>"; };
  el.addEventListener("fieldchange", draw); draw();
 },
 bigdog(u, el) {
  const Q = [["She's too strong.", "L"], ["Head up, hands, circle out.", "I"], ["You've fought out of worse.", "B"], ["I always get stuck on bottom.", "L"], ["Drive through her.", "I"], ["Everybody's watching me lose.", "L"], ["You've hit this stand-up a hundred times.", "B"], ["Base, hands, stand.", "I"]];
  const lab = { L: "little dog", I: "BIG DOG: Instruct", B: "BIG DOG: Believe" };
  el.innerHTML = `<h3>Warm-up: sort the voices</h3><div class="sort">${Q.map(([q, a], i) => `<div class="chipq" data-a="${a}"><q>"${esc(q)}"</q>${["L", "I", "B"].map(x => `<button data-x="${x}">${lab[x]}</button>`).join("")}</div>`).join("")}</div><p id="sortMsg" class="small"></p>
  <h3>${esc(u.tool_title)}</h3><p>${esc(u.tool_intro)}</p>
  ${["Neutral", "Top", "Bottom"].map((s, i) => `<div class="card"><b>${s}</b><div class="grid g3" style="margin-top:6px">${inp(`ld${i}`, "little dog says…")}${inp(`bi${i}`, "INSTRUCT: what to do next")}${inp(`bb${i}`, "BELIEVE: why you can")}</div></div>`).join("")}
  <label class="l">${esc(u.tool_prompts[0][0])}</label>${inp("cue", "e.g., Drive through her")}<label class="l">${esc(u.tool_prompts[1][0])}</label>${inp("cueYou", "You're fine. Hands, angle, finish.")}`;
  let right = 0;
  $$(".chipq", el).forEach(c => $$("button", c).forEach(b => b.onclick = () => { if (c.classList.contains("right")) return; const ok = b.dataset.x === c.dataset.a; c.classList.toggle("right", ok); c.classList.toggle("wrong", !ok); if (ok) right++; $("#sortMsg", el).textContent = ok ? `${right}/8 sorted.` : `Not quite. Ask: does it judge, tell you what to DO, or give a reason you CAN?`; }));
 },
 bank(u, el) {
  el.innerHTML = `<p>${esc(u.tool_intro)}</p>${[1, 2, 3, 4, 5].map(i => `<div class="card"><b>Clip ${i}</b><div class="grid g2" style="margin-top:6px">${inp(`rw${i}`, "When")}${inp(`rs${i}`, "Situation (period, position, score)")}</div><div style="margin-top:8px">${inp(`rd${i}`, "What I did")}</div><div class="row" style="margin-top:8px"><select data-k="rp${i}"><option value="">Pillar shown…</option>${D.pillars.map(p => `<option>${p[0]}</option>`).join("")}</select><label class="small"><input type="checkbox" data-k="rl${i}"> from a loss or hard day</label></div></div>`).join("")}
  <p id="reelMsg" class="small"></p><button class="btn red" id="play">▶ Play my 60-second reel</button>
  <h3>Confidence Bank deposits</h3><div class="row">${inp("depNew", "Today's proof (one specific moment)")}<button class="btn sm" id="dep">Deposit</button></div><div class="list" id="deps" style="margin-top:8px"></div>`;
  const draw = () => { const n = [1, 2, 3, 4, 5].filter(i => F("rl" + i)).length; $("#reelMsg", el).innerHTML = n >= 2 ? "✓ At least two clips from hard days. That's real toughness evidence." : `Rule check: ${n}/2 clips from a loss or hard day.`; $("#deps", el).innerHTML = S.deposits.slice().reverse().map(d => `<div class="it small"><b>${d.d}</b> · ${esc(d.t)}</div>`).join("") || "<div class='muted small'>No deposits yet.</div>"; };
  el.addEventListener("fieldchange", draw); draw();
  $("#dep", el).onclick = () => { const t = F("depNew"); if (!t) return; S.deposits.push({ d: today(), t }); S.f.depNew = ""; $("[data-k=depNew]", el).value = ""; save(); draw(); toast("Deposited"); };
  $("#play", el).onclick = () => { const clips = [1, 2, 3, 4, 5].map(i => F("rd" + i) && { l: `CLIP ${i}${F("rp" + i) ? " · " + F("rp" + i).toUpperCase() : ""}`, t: F("rd" + i), s: [F("rw" + i), F("rs" + i)].filter(Boolean).join(" · ") }).filter(Boolean); if (!clips.length) return toast("Add at least one clip first"); stage(clips.map(c => ({ ...c, ms: 60000 / clips.length })).concat([{ l: "BIG DOG", t: "You've done it before. You can do it again.", s: "", ms: 4000 }])); };
 },
 gotime(u, el) {
  el.innerHTML = `<p>${esc(u.tool_intro)}</p><div class="grid g2">${u.frames.map(([a, b], i) => `<div class="card ${a.includes("GRIT") ? "red" : ""}"><b>${esc(a)}</b><div class="small muted">${esc(b)}</div>${ta(`fr${i}`, "", 3)}</div>`).join("")}</div>
  <button class="btn red" id="reh">▶ Rehearse at real speed</button>
  <h3>If-Then plans</h3>${u.ifthen_rows.map((r, i) => `<div class="grid g2" style="margin-bottom:8px"><div><label class="l">${esc(r)}</label>${inp(`if${i}`)}</div><div><label class="l">…then I will</label>${inp(`th${i}`)}</div></div>`).join("")}
  <label class="l">${esc(u.tool_prompts[0][0])}</label>${ta("t6_0")}`;
  $("#reh", el).onclick = () => { const f = u.frames.map(([a], i) => ({ l: a, t: F("fr" + i) || "(write this frame first)", s: "Eyes closed. See it, hear it, feel it, at real speed.", ms: 7000 })); stage([{ l: "GET READY", t: "Close your eyes after each frame appears.", s: "", ms: 3000 }, ...f]); };
 },
 switch(u, el) {
  el.innerHTML = `<p>${esc(u.tool_intro)}</p><div class="grid g2">${u.process_stops.map((s, i) => `<div><label class="l" style="${s.includes("SWITCH") ? "color:#ff6b84" : ""}">${esc(s)}</label>${inp(`ps${i}`)}</div>`).join("")}</div>
  <label class="l">My SWITCH-ON signal (one physical action)</label>${inp("switchOn", "e.g., snap headgear, slap thighs twice, step on the line")}
  <h3>My First Job</h3><div class="grid g3">${u.firstjob_rows.map((r, i) => `<div><label class="l">${r}</label>${inp(`fj${i}`)}</div>`).join("")}</div>
  <label class="l">My reset loop, in my words (Notice → Breathe → Cue → First Job)</label>${ta("loop", "", 2)}
  <p class="small muted">Then run it under fake pressure in the <a href="#reset">Reset drill</a>.</p>`;
 },
};

function buildTab(u, el) {
  el.innerHTML = `<div class="card">${badge("YOU")}<h2 style="margin-top:4px">${esc(u.tool_title)}</h2><div id="tool"></div></div><button class="btn" id="bDone">Tool built. Take it to the mat →</button>`;
  TOOLS[u.slug](u, $("#tool", el));
  $("#bDone", el).onclick = () => { mark(u.n, "build"); location.hash = `#unit/${u.n}/mat`; };
}

function matTab(u, el) {
  const m = S.mats[u.n] = S.mats[u.n] || [];
  el.innerHTML = `<p class="muted">Your choice: pick ONE. A skill you only write about is a skill you don't have.</p>
  <div class="grid g2">${u.mat.map(([t, d], i) => `<div class="card"><b>${esc(t)}</b><p class="small">${esc(d)}</p></div>`).join("")}</div>
  <div class="card"><h3 style="margin-top:0">Log a Mat Test</h3><div class="grid g3"><div><label class="l">Which</label><select id="mWhich">${u.mat.map(([t]) => `<option>${esc(t)}</option>`).join("")}</select></div><div><label class="l">Date</label><input type="date" id="mDate" value="${today()}"></div><div><label class="l">Tally / result</label><input type="text" id="mRes" placeholder="e.g., 4 of 6 resets"></div></div>
  <button class="btn sm" id="mAdd" style="margin-top:10px">Save attempt</button><div class="list" id="mList" style="margin-top:8px"></div></div>
  <div class="card"><div class="kick">Honest reflection</div><p class="small muted">Specifics beat feelings. Name the period, the position, the words.</p>${u.reflect.map((q, i) => `<label class="l">${i + 1}. ${esc(q)}</label>${ta(`rf${u.n}_${i}`, "", 4)}`).join("")}</div>
  <div class="card"><label class="small"><input type="checkbox" id="usedMatch" ${P(u.n).match ? "checked" : ""}> <b>I used this in a real match</b></label>${inp(`matchNote${u.n}`, "Which match, and what happened?")}</div>`;
  const draw = () => { $("#mList", el).innerHTML = m.map(x => `<div class="it small"><b>${x.d}</b> · ${esc(x.w)} · ${esc(x.r)}</div>`).join("") || "<div class='muted small'>No attempts logged yet.</div>"; };
  draw();
  $("#mAdd", el).onclick = () => { m.push({ w: $("#mWhich", el).value, d: $("#mDate", el).value, r: $("#mRes", el).value }); $("#mRes", el).value = ""; mark(u.n, "mat"); save(); draw(); };
  $("#usedMatch", el).onchange = e => { P(u.n).match = e.target.checked ? 1 : 0; save(); if (e.target.checked) toast("That's the whole point ✓"); };
}

function rewindTab(u, el) {
  el.innerHTML = `<div class="card"><div class="kick">Rewind · no peeking</div><p class="small muted">These prompts reach back to earlier units on purpose. Pulling an answer out of memory is what makes it stick.</p>
  ${u.rewind.map((q, i) => `<label class="l">${esc(q)}</label>${ta(`rw${u.n}_${i}`, "", 2)}`).join("")}
  <p class="small">Then check your answers against the earlier unit or your tools.</p></div>
  <div class="card"><div class="kick">Spaced review</div><p class="small">This unit's ${u.quiz.length} cards ${S.rev[`${u.n}-0`] ? "are in your Rewind deck. They'll come back in 1, 3, 7, then 14 days." : "join your Rewind deck when you finish Learn."}</p><a class="btn sm" href="#review">Open Rewind deck</a></div>`;
}

V.review = () => {
  const q = due();
  if (!Object.keys(S.rev).length) { app.innerHTML = `<h1>Rewind</h1><div class="card">Finish a unit's Learn tab and its cards join your deck. They come back on a schedule: 1, 3, 7, 14, then 30 days. <a href="#unit/1">Start Unit 1 →</a></div>`; return; }
  if (!q.length) { const next = Math.min(...Object.values(S.rev).map(r => r.due)); app.innerHTML = `<h1>Rewind</h1><div class="card">Nothing due. Next card returns <b>${new Date(next).toLocaleDateString()}</b>.</div><button class="btn ghost" id="cram">Practice all cards anyway</button>`; $("#cram").onclick = () => run(allCards().filter(c => S.rev[c.id]), false); return; }
  run(q, true);
  function run(cards, real) {
    let i = 0;
    const show = () => {
      if (i >= cards.length) { app.innerHTML = `<h1>Rewind</h1><div class="card"><b>Done.</b> ${cards.length} card${cards.length > 1 ? "s" : ""} reviewed. 1% better.</div><a class="btn" href="#home">Home</a>`; dot(); return; }
      const c = cards[i];
      app.innerHTML = `<h1>Rewind</h1><p class="muted">Card ${i + 1} of ${cards.length} · Unit ${c.n}</p>
      <div class="flash"><div class="q">${esc(c.q)}</div><textarea id="try" rows="2" placeholder="Answer from memory first" style="margin-top:12px"></textarea><div class="a reveal" id="ans">${esc(c.a)}</div></div>
      <div class="row" style="margin-top:12px" id="ctl"><button class="btn" id="rev">Check</button></div>`;
      $("#rev").onclick = () => { $("#ans").classList.add("show"); $("#ctl").innerHTML = `<span class="small muted">How did you do?</span><span class="sp"></span><button class="btn ghost sm" data-g="0">Not yet</button><button class="btn ghost sm" data-g="1">Partly</button><button class="btn sm" data-g="2">Got it</button>`; $$("[data-g]").forEach(b => b.onclick = () => { if (real) grade(c.id, +b.dataset.g); if (+b.dataset.g === 0 && real) cards.push(c); i++; show(); }); };
    };
    show();
  }
};


/* ---------- Daily check-in: habit loop without punishment ---------- */
const HAB = [
  { k: "water", l: "Water", u: "bottles", t: "count", g: 4, ic: "💧" },
  { k: "fruit", l: "Fruit", u: "servings", t: "count", g: 2, ic: "🍎" },
  { k: "veg", l: "Veggies", u: "servings", t: "count", g: 2, ic: "🥦" },
  { k: "protein", l: "Protein at meals", u: "meals", t: "count", g: 3, ic: "🍳" },
  { k: "bfast", l: "Ate breakfast", t: "yes", ic: "🌅" },
  { k: "fuelup", l: "Ate after practice", t: "yes", ic: "🔋" },
  { k: "sleep", l: "Sleep last night", u: "hours", t: "hours", g: 8.5, ic: "🌙" },
  { k: "sleepq", l: "Sleep quality", t: "scale", ic: "😴" },
  { k: "screens", l: "Screens off 30 min before bed", t: "yes", ic: "📵" },
  { k: "recover", l: "Stretch / recovery", t: "yes", ic: "🧘" },
  { k: "ready", l: "Ready to train", t: "scale", ic: "⚡" },
];
const dkey = d => d.toISOString().slice(0, 10);
const daysBack = n => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return dkey(d); });
const goal = h => +(S.goals[h.k] ?? h.g);
const hit = (h, v) => v === undefined || v === "" ? false : h.t === "yes" ? !!v : h.t === "scale" ? +v >= 4 : +v >= goal(h);
const checked = day => { const w = S.well[day]; return !!w && Object.keys(w).filter(k => k[0] !== "_").length >= 3; };
function consistency() {               // "never miss twice": run continues through single misses
  const days = daysBack(60); let run = 0, miss = 0;
  for (let i = days.length - 1; i >= 0; i--) { const d = days[i];
    if (d === today() && !checked(d)) continue;     // today isn't over yet
    if (checked(d)) { run++; miss = 0; } else { miss++; if (miss >= 2) break; } }
  return run;
}
function weekAvg(k, off) { const ds = daysBack(14).slice(off ? 0 : 7, off ? 7 : 14).filter(d => S.well[d] && S.well[d][k] !== undefined && S.well[d][k] !== ""); if (!ds.length) return null; return ds.reduce((s, d) => s + (+S.well[d][k] || (S.well[d][k] === true ? 1 : 0)), 0) / ds.length; }
function badges() {
  const last7 = daysBack(7), b = [];
  const n = f => last7.filter(f).length;
  if (n(checked) >= 6) b.push(["Consistent", "Checked in 6 of the last 7 days"]);
  if (n(d => S.well[d] && hit(HAB[6], S.well[d].sleep)) >= 5) b.push(["Persistent", "Hit your sleep goal 5 of 7 nights"]);
  if (n(d => S.well[d] && hit(HAB[0], S.well[d].water) && hit(HAB[2], S.well[d].veg)) >= 5) b.push(["Relentless", "Water + veggie goals 5 of 7 days"]);
  const miss2 = daysBack(14).some((d, i, a) => i > 0 && !checked(a[i - 1]) && !checked(d) && d !== today());
  if (!miss2 && daysBack(14).filter(checked).length >= 8) b.push(["Resilient", "Two weeks without missing twice"]);
  return b;
}
V.daily = () => {
  const d = today(), w = S.well[d] = S.well[d] || {};
  const tile = h => {
    const v = w[h.k], ok = hit(h, v);
    let ctl = "";
    if (h.t === "count") ctl = `<div class="row" style="justify-content:center;gap:6px"><button class="btn ghost sm" data-dec="${h.k}">−</button><b style="font-size:24px;min-width:30px">${v || 0}</b><button class="btn sm" data-inc="${h.k}">+</button></div><div class="small muted">goal ${goal(h)} ${h.u}</div>`;
    else if (h.t === "yes") ctl = `<button class="btn ${v ? "" : "ghost"} sm" data-tog="${h.k}">${v ? "Yes ✓" : "Tap if yes"}</button>`;
    else if (h.t === "hours") ctl = `<div class="row" style="justify-content:center;gap:6px"><button class="btn ghost sm" data-sh="-0.5">−</button><b style="font-size:24px;min-width:44px">${v ?? "—"}</b><button class="btn sm" data-sh="0.5">+</button></div><div class="small muted">goal ${goal(h)} h · teens need 8-10</div>`;
    else ctl = `<div class="row" style="justify-content:center;gap:4px">${[1, 2, 3, 4, 5].map(n => `<button class="btn ${+v === n ? "" : "ghost"} sm" data-sc="${h.k}" data-v="${n}" style="padding:5px 8px;min-width:0">${n}</button>`).join("")}</div>`;
    return `<div class="card" style="text-align:center;margin:0;${ok ? "border-color:var(--ok)" : ""}"><div style="font-size:24px">${h.ic}</div><b>${h.l}</b><div style="margin-top:8px">${ctl}</div></div>`;
  };
  const run = consistency(), bd = badges(), dots = daysBack(14).map(x => `<span title="${x}" style="display:inline-block;width:16px;height:16px;border-radius:50%;margin:2px;background:${checked(x) ? "var(--ok)" : x === d ? "transparent" : "#1f3456"};border:${x === d ? "2px dashed var(--ok)" : "0"}"></span>`).join("");
  const arrow = k => { const a = weekAvg(k, 0), b = weekAvg(k, 1); if (a === null || b === null) return ""; const up = a > b + 0.05, dn = a < b - 0.05; return `<span style="color:${up ? "var(--ok)" : dn ? "var(--warn)" : "var(--mute)"}">${up ? "▲" : dn ? "▼" : "■"} ${a.toFixed(1)}</span> <span class="muted small">vs ${b.toFixed(1)}</span>`; };
  app.innerHTML = `<div class="kick" style="margin-top:16px">Daily check-in · 15 seconds</div><h1>Fuel + Recover</h1>
  <p class="hook">Training happens on the mat. Getting better happens here too.</p>
  <div class="card"><div class="row"><div><div class="big">${run} day${run === 1 ? "" : "s"}</div><div class="small muted">consistency run · <b>never miss twice</b>. One off day doesn't break it.</div></div><span class="sp"></span><div style="max-width:300px;text-align:right">${dots}</div></div>
   ${!checked(d) && daysBack(2)[0] && !checked(daysBack(2)[0]) ? `<p class="small" style="color:var(--warn);margin:8px 0 0">You missed yesterday. Check in today and your run keeps going.</p>` : ""}</div>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">${HAB.map(tile).join("")}</div>
  <div class="card"><div class="kick">This week vs last week · 1% better</div><div class="grid g3 small" style="margin-top:8px">
   <div>🌙 Sleep hrs<br>${arrow("sleep") || "<span class='muted'>need 2 weeks</span>"}</div><div>💧 Water<br>${arrow("water") || "<span class='muted'>need 2 weeks</span>"}</div><div>🥦 Veggies<br>${arrow("veg") || "<span class='muted'>need 2 weeks</span>"}</div></div></div>
  <div class="card"><div class="kick">Pillar badges · last 7 days</div>${bd.length ? bd.map(([p, t]) => `<div class="row small" style="margin:6px 0"><span class="badge b-mer" style="margin:0">${p}</span>${t}</div>`).join("") : "<p class='small muted'>Earn Consistent by checking in 6 of 7 days. Others follow.</p>"}</div>
  <div class="card"><label class="l" style="margin-top:0">Tomorrow's 1%: one habit I'll nudge up</label>${inp("well1", "e.g., one more water bottle before practice")}
   <details style="margin-top:12px"><summary class="small muted">Set my own goals</summary><div class="grid g3" style="margin-top:8px">${HAB.filter(h => h.g).map(h => `<div><label class="l">${h.l} (${h.u})</label><input type="number" step="${h.t === "hours" ? 0.5 : 1}" min="0" data-goal="${h.k}" value="${goal(h)}"></div>`).join("")}</div></details>
   <p class="small muted" style="margin:10px 0 0">This tracks fuel and recovery, not your weight. Wrestlers need to eat <i>enough</i>. If making weight ever means skipping meals or water, talk to your coach or trainer.</p></div>`;
  const set = (k, v) => { w[k] = v; save(); const sy = scrollY; V.daily(); bind(); scrollTo(0, sy); };
  $$("[data-inc]").forEach(b => b.onclick = () => set(b.dataset.inc, (+w[b.dataset.inc] || 0) + 1));
  $$("[data-dec]").forEach(b => b.onclick = () => set(b.dataset.dec, Math.max(0, (+w[b.dataset.dec] || 0) - 1)));
  $$("[data-tog]").forEach(b => b.onclick = () => set(b.dataset.tog, !w[b.dataset.tog]));
  $$("[data-sh]").forEach(b => b.onclick = () => set("sleep", Math.min(14, Math.max(0, (w.sleep ?? 8) + +b.dataset.sh))));
  $$("[data-sc]").forEach(b => b.onclick = () => set(b.dataset.sc, +b.dataset.v));
  $$("[data-goal]").forEach(i => i.onchange = () => { S.goals[i.dataset.goal] = +i.value; save(); });
  bind();
  if (checked(d) && !w._toast) { w._toast = 1; save(); toast("Checked in. 1% better ✓"); }
};

/* ---------- Breathe pacer ---------- */
V.breathe = () => {
  app.innerHTML = `<h1>Breathe Like a Bluejay</h1><p class="hook">Coach Arnie's 4-4-4-4 puts the Core Four into every breath.</p>
  <div class="subtabs"><button class="on" data-m="long">Long Breath · 4-4-4-4</button><button data-m="quick">Quick Reset</button></div>
  <div class="pacer"><div class="ring" id="ring"><i id="ph">READY</i><b id="wd">Tap start</b><div class="cnt" id="ct"></div></div>
  <div class="row" style="margin-top:18px"><button class="btn" id="go">Start</button><select id="rounds" style="width:auto"><option value="3">3 rounds</option><option value="5">5 rounds</option><option value="8">8 rounds</option></select></div>
  <p class="small muted" style="max-width:460px;text-align:center">Breathe low into your belly (Knight's Gut Breathing). Stop and breathe normally if you feel dizzy. Never compete in breath-holding.</p></div>`;
  let mode = "long", timer = null; CLEAN.push(() => clearInterval(timer));
  $$("[data-m]").forEach(b => b.onclick = () => { $$("[data-m]").forEach(x => x.classList.remove("on")); b.classList.add("on"); mode = b.dataset.m; stop(); });
  const ring = $("#ring");
  const LONG = [["INHALE", "Persistent", 4, 1.18], ["HOLD", "Consistent", 4, 1.18], ["EXHALE", "Resilient", 4, 0.86], ["HOLD", "Relentless", 4, 0.86]];
  const QUICK = [["INHALE", "Belly breath in", 2, 1.12], ["TOP-UP", "Small sniff", 1, 1.18], ["EXHALE", "Long and slow", 5, 0.86]];
  function stop() { clearInterval(timer); timer = null; $("#go").textContent = "Start"; $("#ph").textContent = "READY"; $("#wd").textContent = "Tap start"; $("#ct").textContent = ""; ring.style.transform = "scale(1)"; }
  $("#go").onclick = () => {
    if (timer) return stop();
    const seq = mode === "long" ? LONG : QUICK, R = mode === "long" ? +$("#rounds").value : 2;
    let r = 0, p = 0, left = seq[0][2]; $("#go").textContent = "Stop";
    const paint = () => { const [ph, wd, , sc] = seq[p]; $("#ph").textContent = ph; $("#wd").textContent = wd; $("#ct").textContent = left; ring.style.transitionDuration = seq[p][2] + "s"; ring.style.transform = `scale(${sc})`; ring.style.borderColor = ph === "EXHALE" ? "var(--red)" : "var(--blue)"; };
    paint();
    timer = setInterval(() => { left--; if (left > 0) { $("#ct").textContent = left; return; } p++; if (p >= seq.length) { p = 0; r++; } if (r >= R) { stop(); $("#wd").textContent = "Done"; mark(3, "mat"); return; } left = seq[p][2]; paint(); }, 1000);
  };
};

/* ---------- Reset drill ---------- */
const ADV = ["She takes you down in the first 15 seconds.", "The ref warns you for stalling.", "You get ridden out the entire second period.", "You're down 0-5 after the first period.", "You get put on your back for near-fall points.", "A call goes against you that you think was wrong.", "Your coach yells something and you can't hear it.", "She escapes with 10 seconds left and ties it.", "Your headgear comes off and the match stops mid-scramble.", "You lose to her in the semis and wrestle back in 40 minutes."];
V.reset = () => {
  const cue = F("cue") || F("bi0") || "(build your cue in Unit 4)";
  const fj = [F("fj0"), F("fj1"), F("fj2")];
  app.innerHTML = `<h1>Reset Drill</h1><p class="hook">Notice → Breathe → Cue → First Job. Train it here so it's automatic on the mat.</p>
  <div class="card"><div class="small muted">Your tools</div><div><b>Cue:</b> ${esc(cue)}</div><div><b>First Job</b> · neutral: ${esc(fj[0] || "—")} · top: ${esc(fj[1] || "—")} · bottom: ${esc(fj[2] || "—")}</div><div class="small muted" style="margin-top:6px">Edit these in <a href="#unit/4/build">Unit 4</a> and <a href="#unit/7/build">Unit 7</a>.</div></div>
  <button class="btn red" id="go">Start a rep</button><div class="list card" id="times"></div>`;
  const T = S.f.resetTimes = S.f.resetTimes || [];
  const drawT = () => { $("#times").innerHTML = T.length ? `<div class="small muted">Your reset times (lower is better, but calm and correct beats fast):</div>` + T.slice(-8).reverse().map(t => `<div class="it small">${t.d} · <b>${t.s.toFixed(1)}s</b> · ${esc(t.a)}</div>`).join("") : "<div class='muted small'>No reps yet.</div>"; };
  drawT();
  $("#go").onclick = () => { const a = ADV[Math.floor(Math.random() * ADV.length)]; const pos = ["neutral", "top", "bottom"][Math.floor(Math.random() * 3)]; const job = fj[["neutral", "top", "bottom"].indexOf(pos)] || "your First Job"; const t0 = performance.now() + 3500;
    stage([{ l: "ADVERSITY", t: a, s: `Restart in ${pos}.`, ms: 3500 }, { l: "1 · NOTICE", t: "That happened.", s: "Name it. Don't argue with it.", ms: 1800 }, { l: "2 · BREATHE", t: "Quick Reset", s: "Belly in, small top-up, long slow exhale.", ms: 6000 }, { l: "3 · CUE", t: cue, s: "Say it as you.", ms: 2200 }, { l: "4 · FIRST JOB", t: job, s: "Tap when you're mentally back in your stance.", ms: 0 }],
      () => { T.push({ d: today(), s: (performance.now() - t0) / 1000, a }); save(); drawT(); mark(7, "mat"); }); };
};

/* ---------- stage (fullscreen sequences) ---------- */
function stage(steps, onBack) {
  const st = $("#stage"); st.classList.add("show"); let i = 0, h;
  const close = () => { clearTimeout(h); st.classList.remove("show"); };
  $("#stClose").onclick = close;
  const next = () => {
    if (i >= steps.length) return close();
    const s = steps[i]; $("#stLab").textContent = s.l; $("#stTxt").textContent = s.t; $("#stSub").textContent = s.s || "";
    const bar = $("#stBar"); bar.style.transition = "none"; bar.style.width = "0";
    $("#stBtn").hidden = !!s.ms;
    if (s.ms) { requestAnimationFrame(() => { bar.style.transition = `width ${s.ms}ms linear`; bar.style.width = "100%"; }); h = setTimeout(() => { i++; next(); }, s.ms); }
    else $("#stBtn").onclick = () => { onBack && onBack(); close(); toast("Back in it ✓"); };
  };
  next();
}

/* ---------- logs ---------- */
V.log = () => {
  app.innerHTML = `<h1>Logs</h1><div class="subtabs"><button class="on" data-l="p">Practice Log</button><button data-l="f">Film Room</button></div><div id="lb"></div>`;
  $$("[data-l]").forEach(b => b.onclick = () => { $$("[data-l]").forEach(x => x.classList.remove("on")); b.classList.add("on"); (b.dataset.l === "p" ? practice : film)(); });
  practice();
  function practice() {
    const lb = $("#lb");
    lb.innerHTML = `<div class="card"><p class="small muted" style="margin-top:0">Coach Arnie's daily prompts. 30 seconds before practice and 30 after. Examples: Single-leg finish · Be first to ties · Breathe and reset fast · Hit my escape first try · Move my feet on shots · Teammates.</p>
    <div class="grid g2"><div><label class="l">Practice Focus</label><input id="pf" type="text"></div><div><label class="l">Pillar Focus</label><select id="pp">${D.pillars.map(p => `<option>${p[0]}</option>`).join("")}</select></div></div>
    <label class="l">How will I show up today?</label><input id="ps" type="text">
    <div class="grid g3"><div><label class="l">Went Well</label><input id="pw" type="text"></div><div><label class="l">Improve</label><input id="pi" type="text"></div><div><label class="l">Gratitude Trio</label><input id="pg" type="text" placeholder="three things"></div></div>
    <div class="grid g3"><div><label class="l">One C</label><select id="pc">${D.fiveCs.map(c => `<option>${c[0]}</option>`).join("")}</select></div><div><label class="l">Pre (1-10)</label><input id="pre" type="number" min="1" max="10"></div><div><label class="l">Post (1-10)</label><input id="post" type="number" min="1" max="10"></div></div>
    <button class="btn" id="psave" style="margin-top:12px">Save practice</button></div><div class="card list" id="plist"></div>`;
    const draw = () => $("#plist").innerHTML = S.logs.slice().reverse().map(l => `<div class="it small"><b>${l.d}</b> · ${esc(l.pf)} · <i>${esc(l.pp)}</i><br>Went well: ${esc(l.pw)} · Improve: ${esc(l.pi)}${l.pc ? ` · ${esc(l.pc)} ${l.pre || "?"}→${l.post || "?"}` : ""}</div>`).join("") || "<div class='muted small'>No practices logged yet.</div>";
    draw();
    $("#psave").onclick = () => { const g = id => $("#" + id).value.trim(); S.logs.push({ d: today(), pf: g("pf"), pp: g("pp"), ps: g("ps"), pw: g("pw"), pi: g("pi"), pg: g("pg"), pc: g("pc"), pre: g("pre"), post: g("post") }); save(); toast("Saved"); practice(); };
  }
  function film() {
    const lb = $("#lb");
    lb.innerHTML = `<div class="card"><p class="small muted" style="margin-top:0">The 24-hour rule: feel it, learn from it, then let it go. KEEP WRESTLING - EVERYDAY IS A NEW MATCH!</p>
    <div class="grid g3"><div><label class="l">Event</label><input id="fe" type="text"></div><div><label class="l">Opponent</label><input id="fo" type="text"></div><div><label class="l">Result / score</label><input id="fr" type="text"></div></div>
    <label class="l">Process steps I actually used</label><div class="row small">${["Night before", "Weigh-in", "Warm-up", "On deck", "Switch ON", "First Job", "Between periods", "Switch OFF"].map(s => `<label><input type="checkbox" class="fs" value="${s}"> ${s}</label>`).join("")}</div>
    <div class="grid g2"><div><label class="l">Little-dog moment (exact words, when)</label><textarea id="fl" rows="2"></textarea></div><div><label class="l">BIG DOG moment (what I said + what my body did)</label><textarea id="fb" rows="2"></textarea></div>
    <div><label class="l">Seconds until I was wrestling my plan again</label><input id="fsec" type="text"></div><div><label class="l">If-then that fired, or one I need</label><input id="fi" type="text"></div>
    <div><label class="l">Confidence Bank deposit</label><input id="fd" type="text"></div><div><label class="l">Improve: one process behavior</label><input id="fim" type="text"></div></div>
    <button class="btn" id="fsave" style="margin-top:12px">Save match</button></div><div class="card list" id="flist"></div>`;
    const draw = () => $("#flist").innerHTML = S.films.slice().reverse().map(l => `<div class="it small"><b>${l.d}</b> · ${esc(l.fe)} vs ${esc(l.fo)} · ${esc(l.fr)}<br>Process: ${l.steps.length}/8 · Improve: ${esc(l.fim)}</div>`).join("") || "<div class='muted small'>No matches logged yet.</div>";
    draw();
    $("#fsave").onclick = () => { const g = id => $("#" + id).value.trim(); const rec = { d: today(), fe: g("fe"), fo: g("fo"), fr: g("fr"), steps: $$(".fs:checked").map(x => x.value), fl: g("fl"), fb: g("fb"), fsec: g("fsec"), fi: g("fi"), fd: g("fd"), fim: g("fim") }; S.films.push(rec); if (rec.fd) S.deposits.push({ d: today(), t: rec.fd }); save(); toast("Saved. Keep wrestling."); film(); };
  }
};

/* ---------- Competition card + manual ---------- */
V.card = () => {
  const fj = [F("fj0"), F("fj1"), F("fj2")].map((x, i) => x && ["N", "T", "B"][i] + ": " + x).filter(Boolean).join(" · ");
  const rows = [["SWITCH ON", F("switchOn")], ["FIRST JOB", fj], ["MY CUE", F("cue")], ["IF", F("if2") || F("if0")], ["THEN", F("th2") || F("th0")], ["RESET", "Notice → Breathe → Cue → First Job"]];
  app.innerHTML = `<h1 class="noprint">Competition Card</h1><p class="hook noprint">Built from your tools. No new teaching at mat-side. Print it or screenshot it.</p>
  <div class="ccard"><h3><img src="bluejay.png" alt="">COMPETITION CARD</h3>${rows.map(([a, b]) => `<div class="r"><b>${a}</b><span>${esc(b) || '<span style="color:#93a6c2">— build this in your units</span>'}</span></div>`).join("")}</div>
  <div class="row noprint" style="margin-top:14px"><button class="btn" onclick="print()">Print</button><a class="btn ghost" href="#manual">What Works for Me →</a></div>`;
};
V.manual = () => {
  const sec = (t, v) => `<div class="card"><div class="kick">${t}</div><div style="white-space:pre-wrap">${v || '<span class="muted">Not built yet.</span>'}</div></div>`;
  const reel = [1, 2, 3, 4, 5].map(i => F("rd" + i) && `• ${esc(F("rd" + i))}${F("rp" + i) ? ` (${esc(F("rp" + i))})` : ""}`).filter(Boolean).join("\n");
  const ift = [0, 1, 2].map(i => F("if" + i) && `• If ${esc(F("if" + i))} → then ${esc(F("th" + i))}`).filter(Boolean).join("\n");
  app.innerHTML = `<div class="kick" style="margin-top:16px">Capstone · Be You</div><h1>What Works for Me</h1><p class="hook">Your own manual, written by the only expert on you. It fills in as you build each unit.</p>
  <div class="card">${badge("MER")}<p><b>Be You.</b> You don't win by copying someone else's mental game. Everything here is in your words, at your ready number, from your real matches.</p></div>
  ${sec("Today's 1%", esc(F("today1")))}
  ${sec("Ready zone", S.f.dialU !== undefined ? `Usual bullpen ${S.f.dialU} · best match ${S.f.dialB}\n${esc(F("t2_1"))}` : "")}
  ${sec("Fuel lines", [1, 2, 3].map(i => F("fue" + i) && `• ${esc(F("sig" + i))} → ${esc(F("fue" + i))}`).filter(Boolean).join("\n"))}
  ${sec("Breath", esc(F("t3_1")))}
  ${sec("BIG DOG cue", [esc(F("cue")), esc(F("cueYou"))].filter(Boolean).join("\n"))}
  ${sec("Highlight reel", reel)}${sec("If-then plans", ift)}
  ${sec("Competition process", [`Switch ON: ${esc(F("switchOn"))}`, ...[0, 1, 2].map(i => F("fj" + i) && `First Job (${["neutral", "top", "bottom"][i]}): ${esc(F("fj" + i))}`)].filter(x => x && !x.endsWith(": ")).join("\n"))}
  <div class="card"><label class="l" style="margin-top:0">When I wrestle like ME, people see…</label>${ta("beYou", "", 3)}</div>
  <div class="row"><a class="btn" href="#card">Make my Competition Card</a><button class="btn ghost" onclick="print()">Print manual</button></div>`;
  bind();
};

/* ---------- coach + data ---------- */
V.coach = () => {
  app.innerHTML = `${CLOUD.isCoach() ? '<a class="btn red" href="#roster" style="margin-top:16px;display:inline-block">Open athlete roster →</a>' : ""}<div class="kick" style="margin-top:16px">For coaches</div><h1>Running YOU University</h1><p class="hook">Short teaching, real reps, athlete choice. About 10 minutes a week of room time.</p>
  <div class="card"><h3 style="margin-top:0">Weekly rhythm</h3><div class="small"><b>MON · 5 min:</b> read the Match Moment aloud and ask "what would you do?" before teaching.<br><b>TUE-WED:</b> fold Mat Test A or B into an existing live drill. Don't add a new block.<br><b>THU · 2 min:</b> Rewind out loud, no notes. Retrieval is the learning event, not a grade.<br><b>MEET:</b> Competition Card only. No new teaching at mat-side.<br><b>NEXT MON:</b> Film Room, then the next unit.</div></div>
  <div class="card"><h3 style="margin-top:0">Recognition template (Merrill)</h3><p class="small">Observation → program word → why it matters → next reinforcement. <i>"You gave up the first score, reset immediately, and attacked the next exchange. That is Resilient. Keep using the same reset."</i></p></div>
  <div class="card"><h3 style="margin-top:0">What's verified about the book</h3><p class="small"><b>Verified (publisher):</b> 4th ed., 164 pp., 7 chapters, Let's Win! International, ISBN 979-8-9882909-4-0. Focus: perform in competition as well as or better than in practice.<br><b>Verified Knight concepts:</b> Love Nerves, BIG-DOG switch, adrenaline as fuel, confidence ≠ mental toughness, Gut Breathing, BIG-DOG self-talk, Go-Time Visualization, BIG-DOG highlight reel, Competition Process, little dog / BIG Dog, instant reset.<br><b>Not verified:</b> chapter titles, order, and which chapter covers which concept. Fill in the Coach Chapter Map in the printed workbook (p. 34).<br><b>Independently developed:</b> every YOU-labeled exercise, Mat Test, reflection, and Rewind card.</p></div>
  <div class="card"><h3 style="margin-top:0">Guardrails</h3><ul class="small"><li>Performance training, not therapy. Self-ratings are not diagnoses.</li><li>Never require personal disclosure. This site stores nothing off the athlete's device.</li><li>Mental toughness never means hiding pain, injury, or concussion symptoms.</li><li>Follow WIAA/NFHS weight-management rules. Never praise unsafe cutting.</li><li>If something an athlete shares worries you, follow school referral procedures.</li><li>Breathing: stop if dizzy. Never compete in breath-holding.</li></ul></div>
  <div class="card"><h3 style="margin-top:0">Sources</h3><div class="small">${Object.entries(SRC).map(([k, v]) => `<div style="margin-bottom:5px"><b>[${k}]</b> ${esc(v)}</div>`).join("")}</div></div>
  <p><a class="btn sm" href="YOU_University_Mental_Game_Workbook.pdf" target="_blank" rel="noopener">Printable workbook (PDF, 35 pp.)</a></p><p class="small muted">An independent Merrill companion. Not written by, endorsed by, or affiliated with Steve Knight or Let's Win! International.</p>`;
};
V.data = () => {
  app.innerHTML = `<h1>Your data</h1>${CLOUD.on ? `<div class="card">Signed in as <b>${esc(CLOUD.user.email)}</b>. Your work syncs to your Merrill account. <button class="btn ghost sm" id="out">Sign out</button></div>` : ""}<div class="card"><p>${CLOUD.on ? "A copy also stays on this device so the app works without Wi-Fi in the gym. It syncs when you're back online." : "Everything you write stays in this browser on this device. If you clear your browser data or switch phones, it's gone unless you back it up."}</p>
  <div class="row"><button class="btn" id="ex">Download backup</button><label class="btn ghost">Restore backup<input type="file" id="im" accept=".json" hidden></label><button class="btn red" id="wipe">Erase everything</button></div></div>`;
  if ($("#out")) $("#out").onclick = () => { firebase.auth().signOut(); try { localStorage.removeItem(KEY); } catch (e) {} S = blank(); location.hash = "#home"; };
  $("#ex").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: "application/json" })); a.download = `you-university-backup-${today()}.json`; a.click(); };
  $("#im").onchange = e => { const r = new FileReader(); r.onload = () => { try { S = Object.assign(blank(), JSON.parse(r.result)); save(); toast("Restored"); dot(); } catch (x) { toast("That file didn't work"); } }; r.readAsText(e.target.files[0]); };
  $("#wipe").onclick = () => { if (confirm("Erase all your YOU University answers on this device?")) { S = blank(); save(); dot(); toast("Erased"); } };
};

V.roster = async (who) => {
  if (!CLOUD.isCoach()) { app.innerHTML = "<h1>Roster</h1><div class='card'>Coaches only.</div>"; return; }
  app.innerHTML = "<h1>Athlete roster</h1><p class='muted'>Loading…</p>";
  let docs; try { docs = (await CLOUD.db.collection("youu").get()).docs.map(d => ({ id: d.id, ...d.data() })); } catch (e) { app.innerHTML = `<h1>Roster</h1><div class="card">Couldn't load: ${esc(e.message)}</div>`; return; }
  const ladder = s => { let t = 0; U.forEach(u => { const p = (s.prog || {})[u.n] || {}; t += ["learn", "build", "mat", "match"].filter(x => p[x]).length; }); return Math.round(100 * t / (U.length * 4)); };
  if (who) {
    const d = docs.find(x => x.id === who); if (!d) return V.roster();
    const s = Object.assign(blank(), d.state || {}), f = s.f || {}, g = k => esc((f[k] || "").trim()) || "<span class='muted'>—</span>";
    app.innerHTML = `<a href="#roster" class="small">← Roster</a><h1>${esc(d.name)}</h1><p class="muted small">${esc(d.email)} · last active ${new Date(d.updatedAt).toLocaleString()} · ladder ${ladder(s)}%</p>
    <div class="grid g2"><div class="card"><div class="kick">Today's 1%</div>${g("today1")}</div><div class="card"><div class="kick">BIG DOG cue</div>${g("cue")}</div>
    <div class="card"><div class="kick">Ready zone</div>usual ${esc(f.dialU ?? "—")} · best ${esc(f.dialB ?? "—")}</div><div class="card"><div class="kick">First Jobs</div>N: ${g("fj0")}<br>T: ${g("fj1")}<br>B: ${g("fj2")}</div></div>
    <div class="card"><div class="kick">Progress by unit</div>${U.map(u => { const p = (s.prog || {})[u.n] || {}; return `<div class="row small" style="margin:4px 0"><b style="width:160px">${u.n}. ${esc(u.title)}</b>${["learn", "build", "mat", "match"].map(x => `<span class="pill" style="${p[x] ? "background:#0a7d55;color:#fff" : ""}">${x}</span>`).join("")}</div>`; }).join("")}</div>
    <div class="card"><div class="kick">Fuel + recover · last 7 days</div>${(() => { const ds = daysBack(7), W = s.well || {}; const av = k => { const v = ds.map(x => W[x] && W[x][k]).filter(x => x !== undefined && x !== ""); return v.length ? (v.reduce((p, c) => p + (+c || 0), 0) / v.length).toFixed(1) : "—"; }; return `<div class="small">Check-ins ${ds.filter(x => W[x] && Object.keys(W[x]).filter(k => k[0] !== "_").length >= 3).length}/7 · sleep ${av("sleep")} h · sleep quality ${av("sleepq")}/5 · water ${av("water")} · veg ${av("veg")} · fruit ${av("fruit")} · ready ${av("ready")}/5</div><div class="small muted" style="margin-top:4px">Low sleep or low "ready" across several days is a reason to check in with her as a person, not a reason to push harder.</div>`; })()}</div>
    <div class="card"><div class="kick">Recent matches (Film Room)</div>${(s.films || []).slice(-5).reverse().map(l => `<div class="small" style="margin:6px 0"><b>${l.d}</b> ${esc(l.fe)} vs ${esc(l.fo)} · ${esc(l.fr)} · process ${l.steps.length}/8 · reset ${esc(l.fsec || "?")}s<br>Improve: ${esc(l.fim)}</div>`).join("") || "<span class='muted small'>None yet.</span>"}</div>
    <div class="card"><div class="kick">Recent practices</div>${(s.logs || []).slice(-5).reverse().map(l => `<div class="small" style="margin:6px 0"><b>${l.d}</b> ${esc(l.pf)} · ${esc(l.pp)} · Went well: ${esc(l.pw)} · Improve: ${esc(l.pi)}</div>`).join("") || "<span class='muted small'>None yet.</span>"}</div>
    <p class="small muted">Use the Merrill recognition template: observation → program word → why it matters → next reinforcement.</p>`;
    return;
  }
  docs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const ci = s => daysBack(7).filter(x => s.well && s.well[x] && Object.keys(s.well[x]).filter(k => k[0] !== "_").length >= 3).length;
  app.innerHTML = `<h1>Athlete roster</h1>${CLOUD.isOwner() ? `<div class="card"><div class="kick">Coaches</div><div class="small" id="coachList">${COACHES.map(c => `<div class="row" style="margin:4px 0">${esc(c)}<span class="sp"></span>${c === OWNER ? "<span class='muted'>owner</span>" : `<button class="btn ghost sm" data-rm="${esc(c)}">Remove</button>`}</div>`).join("")}</div><div class="row" style="margin-top:8px"><input type="text" id="newCoach" placeholder="coach email" style="flex:1"><button class="btn sm" id="addCoach">Add coach</button></div><p class="small muted" style="margin:6px 0 0">Coaches can read every athlete's work. Athletes can't see each other.</p></div>` : ""}
  <div class="card"><div class="kick">Invites (for non-@mapsedu.org emails)</div><div class="small" id="invList">Loading…</div>
   <div class="row" style="margin-top:8px"><input type="text" id="newInv" placeholder="athlete's email" style="flex:1"><button class="btn sm" id="addInv">Invite</button></div>
   <p class="small muted" style="margin:6px 0 0">@mapsedu.org addresses don't need an invite. After inviting, tell the athlete to open the site and sign in with that email (Google or "email me a link").</p></div>
  <p class="muted small">${docs.length} athletes signed in. Read-only. Click a name for detail.</p><div class="card"><table class="t"><tr><th>Athlete</th><th>Ladder</th><th>Check-ins (7d)</th><th>Practices</th><th>Matches</th><th>Last active</th></tr>
  ${docs.filter(d => !COACHES.includes((d.email || "").toLowerCase())).map(d => { const s = d.state || {}; return `<tr><td><a href="#roster/${d.id}">${esc(d.name)}</a></td><td>${ladder(s)}%</td><td>${ci(s)}/7</td><td>${(s.logs || []).length}</td><td>${(s.films || []).length}</td><td class="small">${d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : "—"}</td></tr>`; }).join("")}</table></div>`;
  const drawInv = async () => { try { const q = await CLOUD.db.collection("youuInvites").get(); const joined = new Set(docs.map(d => (d.email || "").toLowerCase()));
      $("#invList").innerHTML = q.docs.length ? q.docs.map(d => `<div class="row" style="margin:4px 0">${esc(d.id)} <span class="muted">${joined.has(d.id) ? "· signed in ✓" : "· not signed in yet"}</span><span class="sp"></span><button class="btn ghost sm" data-rminv="${esc(d.id)}">Remove</button></div>`).join("") : "<span class='muted'>No invites yet.</span>";
      $$("[data-rminv]").forEach(b => b.onclick = async () => { await CLOUD.db.collection("youuInvites").doc(b.dataset.rminv).delete(); toast("Invite removed"); drawInv(); });
    } catch (e) { $("#invList").textContent = "Couldn't load invites: " + e.message; } };
  drawInv();
  $("#addInv").onclick = async () => { const e = $("#newInv").value.trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return toast("Enter a full email");
    try { await CLOUD.db.collection("youuInvites").doc(e).set({ invitedBy: CLOUD.user.email, at: Date.now() }); $("#newInv").value = ""; toast("Invited"); drawInv(); } catch (x) { toast("Couldn't invite: " + x.message); } };
  if (CLOUD.isOwner()) {
    $("#addCoach").onclick = async () => { const e = $("#newCoach").value.trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return toast("Enter a full email"); await CLOUD.db.collection("youuCoaches").doc(e).set({ addedBy: CLOUD.user.email, at: Date.now() }); await CLOUD.loadCoaches(); toast("Coach added"); V.roster(); };
    $$("[data-rm]").forEach(b => b.onclick = async () => { await CLOUD.db.collection("youuCoaches").doc(b.dataset.rm).delete(); await CLOUD.loadCoaches(); toast("Removed"); V.roster(); });
  }
};

/* ---------- router ---------- */
function route() {
  while (CLEAN.length) CLEAN.pop()();
  if (CLOUD.ready && !CLOUD.on) { V.gate(); return; }
  const [v, a, b] = (location.hash.slice(1) || "home").split("/");
  $$("nav.tabs a").forEach(x => x.classList.toggle("on", x.dataset.t === v));
  (v === "unit" ? () => V.unit(a, b || "learn") : v === "roster" ? () => V.roster(a) : V[v] || V.home)();
  window.scrollTo(0, 0); dot();
}
addEventListener("hashchange", route);
V.gate = (msg = "", note = "") => {
  const G = '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>';
  const finishing = firebase.auth().isSignInWithEmailLink(location.href);
  app.innerHTML = `<div class="gate"><img src="bluejay.png" alt=""><h1>YOU University</h1>
  ${finishing ? `<p class="hook">Confirm your email to finish signing in.</p><input type="text" id="em" inputmode="email" autocomplete="email" placeholder="you@mapsedu.org" value="${esc(localStorage.getItem(KEY + "-email") || "")}"><button class="btn" id="finish" style="margin-top:10px;width:100%">Finish signing in</button>`
  : `<p class="hook">Sign in so your work follows you to any device.</p>
  <button class="gbtn" id="gsign">${G}Sign in with Google</button>
  <div class="muted small" style="margin:16px 0 8px">or get a one-tap link by email (no password)</div>
  <input type="text" id="em" inputmode="email" autocomplete="email" placeholder="you@mapsedu.org"><button class="btn" id="link" style="margin-top:10px;width:100%">Email me a sign-in link</button>`}
  ${note ? `<p class="small" style="color:#bfe8d6;margin-top:12px">${esc(note)}</p>` : ""}
  <p class="small" style="color:#ff8fa2;margin-top:12px">${esc(msg)}</p>
  <div class="card small" style="text-align:left;margin-top:18px"><b>Who can get in:</b> any @mapsedu.org address, or an email your coach has invited.<br><b>Who can see what you write:</b> you and your Merrill coaches. No teammates, no one else. If something is really private, keep it on paper or talk to a counselor.</div></div>`;
  const email = () => ($("#em").value || "").trim().toLowerCase();
  if (finishing) {
    $("#finish").onclick = () => firebase.auth().signInWithEmailLink(email(), location.href)
      .then(() => { localStorage.removeItem(KEY + "-email"); history.replaceState(null, "", location.pathname + "#home"); })
      .catch(e => V.gate(e.code === "auth/invalid-action-code" ? "That link expired or was already used. Request a new one." : e.message));
    if (localStorage.getItem(KEY + "-email")) $("#finish").click();
    return;
  }
  $("#gsign").onclick = () => { const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" }); firebase.auth().signInWithPopup(p).catch(e => { if (/popup/.test(e.code)) firebase.auth().signInWithRedirect(p); else V.gate(e.message); }); };
  $("#link").onclick = () => { const e = email(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return toast("Enter your full email");
    $("#link").disabled = true;
    firebase.auth().sendSignInLinkToEmail(e, { url: location.origin + location.pathname, handleCodeInApp: true })
      .then(() => { localStorage.setItem(KEY + "-email", e); V.gate("", `Link sent to ${e}. Open it on this device. Check spam/junk if you don't see it in a minute.`); })
      .catch(x => V.gate(x.message)); };
};
if (CLOUD.ready) {
  firebase.initializeApp(CFG);
  CLOUD.db = firebase.firestore();
  CLOUD.db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
  app.innerHTML = '<p class="muted" style="margin-top:40px;text-align:center">Loading…</p>';
  firebase.auth().onAuthStateChanged(async u => {
    if (!u) { CLOUD.on = false; CLOUD.user = null; $("#who").hidden = true; return route(); }
    await CLOUD.loadCoaches();
    if (!(await CLOUD.allowed(u))) { const em = u.email; await firebase.auth().signOut(); return V.gate(`${em} isn't a Merrill school account and hasn't been invited yet. Use your @mapsedu.org email, or ask your coach to invite this address.`); }
    CLOUD.user = u;
    try {
      const snap = await CLOUD.db.collection("youu").doc(u.uid).get();
      const lastUid = localStorage.getItem(KEY + "-uid");
      if (snap.exists && snap.data().state) S = Object.assign(blank(), snap.data().state);
      else if (lastUid && lastUid !== u.uid) S = blank();          // shared device: never hand one athlete's work to another
      localStorage.setItem(KEY + "-uid", u.uid);
    } catch (e) { toast("Offline: using this device's copy"); }
    CLOUD.on = true; $("#who").hidden = false; CLOUD.setStatus("synced ✓");
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    if (!(await CLOUD.db.collection("youu").doc(u.uid).get().catch(() => ({ exists: true }))).exists) CLOUD.push();
    route();
  });
} else route();
})();
