import { BLSEngine, BALL_COLORS, SOUND_PRESETS } from "./bls.js";

const PHASES = [
  "history",
  "preparation",
  "assessment",
  "desensitization",
  "installation",
  "body_scan",
  "closure",
  "reevaluation",
];

const state = {
  view: "home",
  people: [],
  person: null,
  session: null,
  events: [],
  say: "Izaberi radni prostor osobe, pa kreni sesiju.",
  remaining: 0,
  settingsOpen: false,
  ai: {},
  prefs: loadPrefs(),
  voices: [],
};

function loadPrefs() {
  try {
    return {
      agentTalk: true,
      voiceURI: "",
      setSeconds: 38,
      speed: 1.15,
      ballColor: BALL_COLORS[0],
      ballSize: 22,
      sound: "click",
      volume: 0.35,
      visual: true,
      audio: true,
      rumble: true,
      binaural: false,
      binauralHz: 6,
      trail: true,
      manualStick: false,
      ...JSON.parse(localStorage.getItem("emdr-prefs") || "{}"),
    };
  } catch {
    return { agentTalk: true, setSeconds: 38, speed: 1.15 };
  }
}

function savePrefs() {
  localStorage.setItem("emdr-prefs", JSON.stringify(state.prefs));
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

const appEl = document.getElementById("app");
let bls = null;

function speak(text) {
  if (!state.prefs.agentTalk || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = state.voices;
  const chosen =
    voices.find((v) => v.voiceURI === state.prefs.voiceURI) ||
    voices.find((v) => /sr|hr|bs|sl/i.test(v.lang)) ||
    voices.find((v) => /en/i.test(v.lang));
  if (chosen) u.voice = chosen;
  u.rate = 0.92;
  u.pitch = 0.95;
  window.speechSynthesis.speak(u);
}

function refreshVoices() {
  state.voices = window.speechSynthesis.getVoices();
}

refreshVoices();
window.speechSynthesis.onvoiceschanged = refreshVoices;

function render() {
  appEl.innerHTML = `
    <div class="shell ${bls?.running ? "running" : ""}">
      <header class="topbar">
        <div class="brand">EMDR Room <span>self-guided</span></div>
        ${state.session ? `<div class="phase-pill">${state.session.phase || "preparation"}</div>` : ""}
        <div class="spacer"></div>
        ${state.person ? `<span class="muted">${escapeHtml(state.person.name)}</span>` : ""}
        <button class="ghost" id="btn-settings">AI / ključevi</button>
        ${state.view === "room" ? `<button class="ghost" id="btn-home">Radni prostor</button>` : ""}
      </header>
      ${state.view === "home" ? renderHome() : renderRoom()}
    </div>
    ${state.settingsOpen ? renderSettings() : ""}
  `;
  bind();
  if (state.view === "room") mountBls();
}

function renderHome() {
  return `
    <main class="home">
      <p class="muted">Radni prostor po osobi · memorija sesija ostaje ovde</p>
      <h1 class="lede">Jedna kuglica. Kratak vodič. Tišina dok ide levo‑desno.</h1>
      <p class="sub">Posle seta od ${state.prefs.setSeconds}s agent samo napiše cue — ili, ako želiš, izgovori ga. Nije terapeut. Stop je uvek tu.</p>
      <div class="create">
        <input id="new-name" placeholder="Ime osobe / workspace" />
        <button class="solid" id="btn-create">Novi prostor</button>
      </div>
      <div class="people">
        ${state.people.map((p) => `
          <button class="card" data-open="${p.id}">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="muted">${escapeHtml(p.current_target || p.presenting_issue || "Još nema targeta")}</p>
            <p class="muted">SUDs ${p.last_suds ?? "—"} · PC ${escapeHtml(p.positive_cognition || "—")}</p>
          </button>
        `).join("")}
      </div>
      ${state.person ? renderWorkspace() : ""}
    </main>
  `;
}

function renderWorkspace() {
  const p = state.person;
  const sessions = p.sessions || [];
  const memory = (p.memory?.session_summaries || []).slice().reverse();
  return `
    <section class="card" style="margin-top:22px;grid-column:1/-1">
      <div class="row">
        <h3 style="margin:0">${escapeHtml(p.name)}</h3>
        <button class="solid" id="btn-start">Nova sesija</button>
        <button class="danger tiny" id="btn-del">Obriši prostor</button>
      </div>
      <div class="controls" style="margin-top:14px">
        ${field("Presenting issue", "presenting_issue", p.presenting_issue)}
        ${field("Safe place", "safe_place", p.safe_place)}
        ${field("Target", "current_target", p.current_target)}
        ${field("Negativna kognicija", "negative_cognition", p.negative_cognition)}
        ${field("Pozitivna kognicija", "positive_cognition", p.positive_cognition)}
        ${field("Snage", "strengths", p.strengths)}
      </div>
      <p class="muted" style="margin-top:14px">Memorija sesija — agent je vidi, ne mora da je recituje.</p>
      <div class="muted">${memory.length ? memory.map((m) => `<div>• ${escapeHtml(m.at?.slice(0,10) || "")} — ${escapeHtml(m.summary || "")}</div>`).join("") : "Još nema sažetaka."}</div>
      <p class="muted" style="margin-top:12px">Prethodne sesije</p>
      ${sessions.map((s) => `
        <button class="tiny" data-resume="${s.id}">${escapeHtml(s.created_at?.slice(0,16) || "")} · ${s.phase} · ${s.status}</button>
      `).join(" ")}
    </section>
  `;
}

function field(label, key, value) {
  return `<label class="field">${label}<input data-person="${key}" value="${escapeAttr(value || "")}" /></label>`;
}

function renderRoom() {
  const s = state.session || {};
  return `
    <main class="room">
      <div class="lightbar-wrap">
        <div class="lightbar"><canvas id="bls"></canvas></div>
        <div class="rail-caption">
          <span>levo</span>
          <span id="remain">${bls?.running ? `${Math.ceil(state.remaining)}s` : `set ${state.prefs.setSeconds}s`}</span>
          <span>desno</span>
        </div>
      </div>
      <section class="guide">
        <p class="say" id="say">${escapeHtml(state.say)}</p>
        <div class="composer">
          <div class="metrics">
            <label>SUDs <b>${s.suds ?? "—"}</b>
              <input type="range" min="0" max="10" value="${s.suds ?? 5}" id="suds" />
            </label>
            <label>VOC <b>${s.voc ?? "—"}</b>
              <input type="range" min="1" max="7" value="${s.voc ?? 3}" id="voc" />
            </label>
          </div>
          <textarea id="notice" placeholder="Posle seta: šta sada primećuješ? (ne mora detalj)"></textarea>
          <div class="row">
            <button class="solid" id="btn-set">${bls?.running ? "Set u toku…" : "Kreni set"}</button>
            <button class="danger" id="btn-stop">Stop</button>
            <button class="ghost" id="btn-safe">Safe place</button>
            <button class="ghost" id="btn-send">Pošalji vodiču</button>
            <button class="ghost" id="btn-close">Zatvori sesiju</button>
          </div>
        </div>
      </section>
      ${renderDrawer()}
    </main>
  `;
}

function renderDrawer() {
  const p = state.prefs;
  return `
    <aside class="drawer">
      <h4>BLS · kuglica · zvuk · joystick</h4>
      <div class="controls">
        <label class="field">Trajanje seta (${p.setSeconds}s)
          <input type="range" min="20" max="120" value="${p.setSeconds}" data-pref="setSeconds" />
        </label>
        <label class="field">Brzina (${p.speed} Hz)
          <input type="range" min="0.35" max="2.8" step="0.05" value="${p.speed}" data-pref="speed" />
        </label>
        <label class="field">Veličina kuglice
          <input type="range" min="10" max="48" value="${p.ballSize}" data-pref="ballSize" />
        </label>
        <label class="field">Jačina zvuka
          <input type="range" min="0" max="1" step="0.01" value="${p.volume}" data-pref="volume" />
        </label>
        <div class="field">Boja kuglice
          <div class="swatches">
            ${BALL_COLORS.map((c) => `<button class="swatch ${p.ballColor === c ? "on" : ""}" data-color="${c}" style="background:${c}"></button>`).join("")}
            <input type="color" value="${p.ballColor}" data-pref="ballColor" />
          </div>
        </div>
        <label class="field">Zvuk u slušalicama
          <select data-pref="sound">
            ${SOUND_PRESETS.map((s) => `<option value="${s.id}" ${p.sound === s.id ? "selected" : ""}>${s.label}</option>`).join("")}
          </select>
        </label>
        <label class="field">Binaural podloga (${p.binauralHz} Hz)
          <input type="range" min="2" max="12" step="0.5" value="${p.binauralHz}" data-pref="binauralHz" />
        </label>
        <label class="field">Glas agenta
          <select data-pref="voiceURI">
            <option value="">Automatski</option>
            ${state.voices.map((v) => `<option value="${escapeAttr(v.voiceURI)}" ${p.voiceURI === v.voiceURI ? "selected" : ""}>${escapeHtml(v.name)} (${v.lang})</option>`).join("")}
          </select>
        </label>
        ${toggle("agentTalk", "Agent priča (isključi = samo piše posle seta)")}
        ${toggle("visual", "Vizuelna kuglica")}
        ${toggle("audio", "Stereo klik levo/desno")}
        ${toggle("binaural", "Binaural bed ispod klika")}
        ${toggle("rumble", "Joystick rumble L/R")}
        ${toggle("trail", "Trag kuglice")}
        ${toggle("manualStick", "Levi stick ručno vozi kuglicu")}
      </div>
      <div class="pad ${bls?.pad() ? "on" : ""}" id="pad-status">
        Joystick: ${bls?.pad() ? `povezan (${bls.pad().id})` : "nije detektovan — Xbox/DirectInput u Chrome"}
        · A start · B stop · X safe place · Y audio · LB/RB brzina · Back boja · Start zvuk
      </div>
      <p class="warn">Nije medicinski uređaj. Teški PTSD, disocijacija, srce, trudnoća — prvo klinika. Hitno: 194.</p>
    </aside>
  `;
}

function toggle(key, label) {
  return `<label class="field"><input type="checkbox" data-check="${key}" ${state.prefs[key] ? "checked" : ""} /> ${label}</label>`;
}

function renderSettings() {
  const ai = state.ai || {};
  return `
    <div class="overlay" id="overlay">
      <div class="panel">
        <h3>Provideri</h3>
        <p class="muted">DeepSeek i ChatGPT (OpenAI-compatible). Aktivni: <b>${ai.provider || "deepseek"}</b></p>
        <label class="field">Aktivni provider
          <select id="provider">
            <option value="deepseek" ${ai.provider === "deepseek" ? "selected" : ""}>DeepSeek</option>
            <option value="openai" ${ai.provider === "openai" ? "selected" : ""}>ChatGPT / OpenAI</option>
          </select>
        </label>
        <label class="field">DeepSeek key ${ai.deepseek_ready ? "(spreman)" : ""}
          <input id="ds-key" type="password" placeholder="sk-..." />
        </label>
        <label class="field">OpenAI key ${ai.openai_ready ? "(spreman)" : ""}
          <input id="oa-key" type="password" placeholder="sk-..." />
        </label>
        <label class="field">DeepSeek model
          <input id="ds-model" value="${escapeAttr(ai.deepseek_model || "deepseek-chat")}" />
        </label>
        <label class="field">OpenAI model
          <input id="oa-model" value="${escapeAttr(ai.openai_model || "gpt-4o-mini")}" />
        </label>
        <div class="row" style="margin-top:12px">
          <button class="solid" id="save-ai">Sačuvaj</button>
          <button class="ghost" id="close-ai">Zatvori</button>
        </div>
      </div>
    </div>
  `;
}

function bind() {
  document.getElementById("btn-settings")?.addEventListener("click", async () => {
    state.ai = await api("/api/settings");
    state.settingsOpen = true;
    render();
  });
  document.getElementById("close-ai")?.addEventListener("click", () => {
    state.settingsOpen = false;
    render();
  });
  document.getElementById("save-ai")?.addEventListener("click", async () => {
    await api("/api/settings", {
      method: "POST",
      body: {
        provider: document.getElementById("provider").value,
        deepseek_api_key: document.getElementById("ds-key").value || undefined,
        openai_api_key: document.getElementById("oa-key").value || undefined,
        deepseek_model: document.getElementById("ds-model").value,
        openai_model: document.getElementById("oa-model").value,
      },
    });
    state.ai = await api("/api/settings");
    state.settingsOpen = false;
    render();
  });
  document.getElementById("btn-home")?.addEventListener("click", async () => {
    bls?.stop();
    state.view = "home";
    state.session = null;
    if (state.person) state.person = await api(`/api/people/${state.person.id}`);
    render();
  });
  document.getElementById("btn-create")?.addEventListener("click", async () => {
    const name = document.getElementById("new-name").value.trim();
    if (!name) return;
    const person = await api("/api/people", { method: "POST", body: { name } });
    await loadPeople();
    state.person = await api(`/api/people/${person.id}`);
    render();
  });
  document.querySelectorAll("[data-open]").forEach((el) => {
    el.addEventListener("click", async () => {
      state.person = await api(`/api/people/${el.dataset.open}`);
      render();
    });
  });
  document.querySelectorAll("[data-person]").forEach((el) => {
    el.addEventListener("change", async () => {
      state.person = await api(`/api/people/${state.person.id}`, {
        method: "PATCH",
        body: { [el.dataset.person]: el.value },
      });
    });
  });
  document.getElementById("btn-del")?.addEventListener("click", async () => {
    if (!confirm("Obrisati ovaj radni prostor?")) return;
    await api(`/api/people/${state.person.id}`, { method: "DELETE" });
    state.person = null;
    await loadPeople();
    render();
  });
  document.getElementById("btn-start")?.addEventListener("click", startSession);
  document.querySelectorAll("[data-resume]").forEach((el) => {
    el.addEventListener("click", () => openSession(el.dataset.resume));
  });
  document.getElementById("btn-set")?.addEventListener("click", startSet);
  document.getElementById("btn-stop")?.addEventListener("click", () => stopSet(true));
  document.getElementById("btn-safe")?.addEventListener("click", safePlace);
  document.getElementById("btn-send")?.addEventListener("click", () => sendTurn(false));
  document.getElementById("btn-close")?.addEventListener("click", closeSession);
  document.getElementById("suds")?.addEventListener("change", (e) => patchSession({ suds: Number(e.target.value) }));
  document.getElementById("voc")?.addEventListener("change", (e) => patchSession({ voc: Number(e.target.value) }));
  document.querySelectorAll("[data-pref]").forEach((el) => {
    el.addEventListener("input", () => {
      const key = el.dataset.pref;
      let val = el.type === "range" || el.type === "color" ? el.value : el.value;
      if (["setSeconds", "ballSize", "speed", "volume", "binauralHz"].includes(key)) val = Number(val);
      state.prefs[key] = val;
      savePrefs();
      applyPrefs();
      if (key === "setSeconds" || key === "speed" || key === "binauralHz") {
        const remain = document.getElementById("remain");
        if (remain && !bls?.running) remain.textContent = `set ${state.prefs.setSeconds}s`;
      }
    });
  });
  document.querySelectorAll("[data-check]").forEach((el) => {
    el.addEventListener("change", () => {
      state.prefs[el.dataset.check] = el.checked;
      savePrefs();
      applyPrefs();
      if (el.dataset.check === "agentTalk" && !el.checked) window.speechSynthesis.cancel();
    });
  });
  document.querySelectorAll("[data-color]").forEach((el) => {
    el.addEventListener("click", () => {
      state.prefs.ballColor = el.dataset.color;
      savePrefs();
      applyPrefs();
      render();
    });
  });
}

function mountBls() {
  const canvas = document.getElementById("bls");
  if (!canvas) return;
  if (!bls || bls.canvas !== canvas) {
    bls = new BLSEngine(canvas);
    bls.onComplete = () => afterSet();
    bls.onTick = ({ remaining }) => {
      state.remaining = remaining;
      const el = document.getElementById("remain");
      if (el) el.textContent = `${Math.ceil(remaining)}s`;
    };
    bls.onGamepad = (cmd) => {
      if (cmd === "start") startSet();
      if (cmd === "stop") stopSet(true);
      if (cmd === "safe") safePlace();
      if (cmd === "audio") {
        state.prefs.audio = !state.prefs.audio;
        savePrefs();
        applyPrefs();
      }
      if (cmd === "color") {
        const i = BALL_COLORS.indexOf(state.prefs.ballColor);
        state.prefs.ballColor = BALL_COLORS[(i + 1) % BALL_COLORS.length];
        savePrefs();
        applyPrefs();
      }
      if (cmd === "sound") {
        const i = SOUND_PRESETS.findIndex((s) => s.id === state.prefs.sound);
        state.prefs.sound = SOUND_PRESETS[(i + 1) % SOUND_PRESETS.length].id;
        savePrefs();
        applyPrefs();
      }
    };
    requestAnimationFrame(() => bls._loop(performance.now()));
  }
  applyPrefs();
}

function applyPrefs() {
  if (!bls) return;
  Object.assign(bls.settings, {
    speed: state.prefs.speed,
    ballColor: state.prefs.ballColor,
    ballSize: state.prefs.ballSize,
    trail: state.prefs.trail,
    visual: state.prefs.visual,
    audio: state.prefs.audio,
    rumble: state.prefs.rumble,
    sound: state.prefs.sound,
    binaural: state.prefs.binaural,
    binauralHz: state.prefs.binauralHz,
    manualStick: state.prefs.manualStick,
  });
  bls.setVolume(Number(state.prefs.volume));
  bls.draw();
}

async function startSession() {
  const data = await api(`/api/people/${state.person.id}/sessions`, {
    method: "POST",
    body: {
      target: state.person.current_target,
      negative_cognition: state.person.negative_cognition,
      positive_cognition: state.person.positive_cognition,
    },
  });
  state.session = data.session;
  state.person = data.person;
  state.say = data.opening?.content || state.say;
  state.view = "room";
  render();
  speak(state.say);
}

async function openSession(id) {
  const data = await api(`/api/sessions/${id}`);
  state.session = data;
  state.person = data.person;
  const last = [...(data.events || [])].reverse().find((e) => e.role === "guide");
  state.say = last?.content || state.say;
  state.view = "room";
  render();
}

async function patchSession(fields) {
  if (!state.session) return;
  state.session = await api(`/api/sessions/${state.session.id}`, {
    method: "PATCH",
    body: fields,
  });
  render();
}

async function startSet() {
  if (!bls || bls.running) return;
  await bls.ensureAudio();
  window.speechSynthesis.cancel();
  state.say = "Samo primeti. Pričamo posle seta.";
  const say = document.getElementById("say");
  if (say) say.textContent = state.say;
  document.body.classList.add("running");
  bls.start(Number(state.prefs.setSeconds) || 38);
  if (state.session) {
    api(`/api/sessions/${state.session.id}/events`, {
      method: "POST",
      body: { role: "system", kind: "set_start", content: `BLS ${state.prefs.setSeconds}s`, phase: state.session.phase },
    }).catch(() => {});
  }
}

function stopSet(user) {
  bls?.stop();
  document.body.classList.remove("running");
  if (user) {
    state.say = "Stop. Noge na pod, dah. Safe place ako treba.";
    const say = document.getElementById("say");
    if (say) say.textContent = state.say;
    speak(state.say);
  }
}

async function afterSet() {
  document.body.classList.remove("running");
  const notice = document.getElementById("notice")?.value.trim();
  await sendTurn(true, notice || "(set završen, još nisam rekao šta je došlo)");
}

async function sendTurn(afterSet, text) {
  if (!state.session) return;
  const message = text ?? document.getElementById("notice")?.value.trim() ?? "";
  const suds = Number(document.getElementById("suds")?.value);
  const voc = Number(document.getElementById("voc")?.value);
  const data = await api(`/api/sessions/${state.session.id}/turn`, {
    method: "POST",
    body: {
      message,
      after_set: afterSet,
      phase: state.session.phase,
      suds,
      voc,
    },
  });
  state.session = data.session;
  state.person = data.person;
  state.say = data.reply?.say || state.say;
  const box = document.getElementById("notice");
  if (box && !afterSet) box.value = "";
  const say = document.getElementById("say");
  if (say) say.textContent = state.say;
  speak(state.say);
  if (data.reply?.action === "start_set") {
    /* stay idle; user starts next set */
  }
  if (data.reply?.phase && data.reply.phase !== state.session.phase) {
    render();
  }
}

async function safePlace() {
  stopSet(false);
  state.say = "Safe place. Slike, zvukovi, mirisi tog mesta. Ruke na ramena ako treba butterfly hug.";
  const say = document.getElementById("say");
  if (say) say.textContent = state.say;
  speak(state.say);
  if (state.session) {
    api(`/api/sessions/${state.session.id}/events`, {
      method: "POST",
      body: { role: "guide", kind: "safe_place", content: state.say, phase: "preparation" },
    }).catch(() => {});
  }
}

async function closeSession() {
  if (!state.session) return;
  const data = await api(`/api/sessions/${state.session.id}/close`, { method: "POST" });
  state.session = data.session;
  state.say = data.event?.content || data.summary;
  render();
  speak(state.say);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/`/g, "");
}

async function loadPeople() {
  state.people = await api("/api/people");
  state.ai = await api("/api/health").then((h) => h.ai).catch(() => ({}));
}

await loadPeople();
render();
