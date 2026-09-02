from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import db, llm
from .protocol import OPENING_SCRIPT, SYSTEM_PROMPT, person_context

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"

app = FastAPI(title="EMDR Room")
db.init_db()
app.mount("/static", StaticFiles(directory=STATIC), name="static")


class PersonIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class PersonPatch(BaseModel):
    name: str | None = None
    presenting_issue: str | None = None
    strengths: str | None = None
    safe_place: str | None = None
    current_target: str | None = None
    negative_cognition: str | None = None
    positive_cognition: str | None = None
    last_suds: int | None = None
    last_voc: int | None = None
    notes: str | None = None
    memory: dict[str, Any] | None = None
    preferences: dict[str, Any] | None = None


class SessionIn(BaseModel):
    title: str | None = None
    phase: str | None = None
    target: str | None = None
    negative_cognition: str | None = None
    positive_cognition: str | None = None
    suds: int | None = None
    voc: int | None = None
    settings: dict[str, Any] | None = None


class SessionPatch(BaseModel):
    title: str | None = None
    phase: str | None = None
    status: str | None = None
    target: str | None = None
    negative_cognition: str | None = None
    positive_cognition: str | None = None
    suds: int | None = None
    voc: int | None = None
    summary: str | None = None
    settings: dict[str, Any] | None = None


class EventIn(BaseModel):
    role: str
    kind: str
    content: str = ""
    phase: str = ""
    meta: dict[str, Any] | None = None


class TurnIn(BaseModel):
    message: str = ""
    phase: str | None = None
    after_set: bool = False
    suds: int | None = None
    voc: int | None = None
    provider: str | None = None


class SettingsIn(BaseModel):
    provider: str | None = None
    deepseek_api_key: str | None = None
    openai_api_key: str | None = None
    deepseek_model: str | None = None
    openai_model: str | None = None
    deepseek_base_url: str | None = None
    openai_base_url: str | None = None


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC / "index.html")


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"ok": True, "ai": llm.public_ai_status()}


@app.get("/api/settings")
def get_settings() -> dict[str, Any]:
    status = llm.public_ai_status()
    status["has_saved_deepseek"] = bool(db.get_setting("deepseek_api_key"))
    status["has_saved_openai"] = bool(db.get_setting("openai_api_key"))
    return status


@app.post("/api/settings")
def save_settings(payload: SettingsIn) -> dict[str, Any]:
    mapping = payload.model_dump(exclude_none=True)
    for key, value in mapping.items():
        db.set_setting(key, str(value).strip())
    return get_settings()


@app.get("/api/people")
def people() -> list[dict[str, Any]]:
    return db.list_people()


@app.post("/api/people")
def add_person(payload: PersonIn) -> dict[str, Any]:
    return db.create_person(payload.name)


@app.get("/api/people/{person_id}")
def person(person_id: int) -> dict[str, Any]:
    found = db.get_person(person_id)
    if not found:
        raise HTTPException(404, "Osoba nije pronađena.")
    found["sessions"] = db.list_sessions(person_id)
    return found


@app.patch("/api/people/{person_id}")
def patch_person(person_id: int, payload: PersonPatch) -> dict[str, Any]:
    if not db.get_person(person_id):
        raise HTTPException(404, "Osoba nije pronađena.")
    return db.update_person(person_id, payload.model_dump(exclude_none=True))


@app.delete("/api/people/{person_id}")
def remove_person(person_id: int) -> dict[str, bool]:
    db.delete_person(person_id)
    return {"ok": True}


@app.post("/api/people/{person_id}/sessions")
def start_session(person_id: int, payload: SessionIn) -> dict[str, Any]:
    if not db.get_person(person_id):
        raise HTTPException(404, "Osoba nije pronađena.")
    session = db.create_session(person_id, payload.model_dump(exclude_none=True))
    person = db.get_person(person_id)
    prior = db.list_sessions(person_id)
    phase = session.get("phase") or "preparation"
    if len(prior) > 1:
        phase = "reevaluation"
        db.update_session(session["id"], {"phase": phase})
        session["phase"] = phase
    opening = OPENING_SCRIPT.get(phase, OPENING_SCRIPT["preparation"])
    event = db.add_event(session["id"], "guide", "cue", opening, phase=phase)
    return {"session": session, "person": person, "opening": event}


@app.get("/api/sessions/{session_id}")
def session(session_id: int) -> dict[str, Any]:
    found = db.get_session(session_id)
    if not found:
        raise HTTPException(404, "Sesija nije pronađena.")
    found["events"] = db.list_events(session_id)
    found["person"] = db.get_person(found["person_id"])
    return found


@app.patch("/api/sessions/{session_id}")
def patch_session(session_id: int, payload: SessionPatch) -> dict[str, Any]:
    if not db.get_session(session_id):
        raise HTTPException(404, "Sesija nije pronađena.")
    return db.update_session(session_id, payload.model_dump(exclude_none=True))


@app.post("/api/sessions/{session_id}/events")
def post_event(session_id: int, payload: EventIn) -> dict[str, Any]:
    if not db.get_session(session_id):
        raise HTTPException(404, "Sesija nije pronađena.")
    return db.add_event(
        session_id,
        payload.role,
        payload.kind,
        payload.content,
        payload.phase,
        payload.meta,
    )


@app.post("/api/sessions/{session_id}/turn")
def turn(session_id: int, payload: TurnIn) -> dict[str, Any]:
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(404, "Sesija nije pronađena.")
    person = db.get_person(session["person_id"])
    if payload.message.strip():
        db.add_event(
            session_id,
            "user",
            "after_set" if payload.after_set else "say",
            payload.message.strip(),
            phase=payload.phase or session.get("phase") or "",
            meta={"suds": payload.suds, "voc": payload.voc},
        )
    events = db.list_events(session_id, limit=24)
    history_msgs = []
    for event in events:
        role = "assistant" if event["role"] == "guide" else "user"
        history_msgs.append({"role": role, "content": event.get("content") or ""})
    phase = payload.phase or session.get("phase") or "preparation"
    state_note = (
        f"Trenutna faza: {phase}. after_set={payload.after_set}. "
        f"session target={session.get('target')} NC={session.get('negative_cognition')} "
        f"PC={session.get('positive_cognition')} SUDs={payload.suds if payload.suds is not None else session.get('suds')} "
        f"VOC={payload.voc if payload.voc is not None else session.get('voc')}."
    )
    if payload.after_set:
        state_note += (
            " Upravo je završen BLS set. Odgovori kao posle seta: dah, šta primećuješ, "
            "ili idi sa tim ako je korisnik već javio šta je došlo. Ne pričaj dugo."
        )
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": person_context(person, db.list_sessions(person["id"]))},
        {"role": "system", "content": state_note},
        *history_msgs[-18:],
    ]
    if payload.message.strip() and not any(
        m["content"] == payload.message.strip() for m in history_msgs[-2:]
    ):
        messages.append({"role": "user", "content": payload.message.strip()})
    try:
        raw = llm.complete(messages, provider=payload.provider)
        parsed = llm.parse_agent_json(raw)
    except llm.LLMError as exc:
        fallback = (
            "Pusti. Dubok dah. Šta sada primećuješ?"
            if payload.after_set
            else "Nisam stigao do modela. Možeš i bez mene: primeti, pa idi sa tim. Stop je uvek tu."
        )
        parsed = {
            "say": fallback,
            "phase": phase,
            "action": "start_set" if payload.after_set else "wait",
            "set_seconds": 38,
            "updates": {},
            "error": str(exc),
        }
    updates = {
        k: v
        for k, v in (parsed.get("updates") or {}).items()
        if v not in (None, "", [])
    }
    if parsed.get("phase"):
        updates["phase"] = parsed["phase"]
    if payload.suds is not None:
        updates["suds"] = payload.suds
    if payload.voc is not None:
        updates["voc"] = payload.voc
    if updates:
        db.update_session(session_id, updates)
    event = db.add_event(
        session_id,
        "guide",
        "after_set" if payload.after_set else "cue",
        parsed.get("say") or "",
        phase=parsed.get("phase") or phase,
        meta={
            "action": parsed.get("action"),
            "set_seconds": parsed.get("set_seconds"),
        },
    )
    return {
        "reply": parsed,
        "event": event,
        "session": db.get_session(session_id),
        "person": db.get_person(session["person_id"]),
    }


@app.post("/api/sessions/{session_id}/close")
def close_session(session_id: int) -> dict[str, Any]:
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(404, "Sesija nije pronađena.")
    person = db.get_person(session["person_id"])
    events = db.list_events(session_id, limit=40)
    transcript = "\n".join(
        f"{e['role']}: {e.get('content', '')}" for e in events if e.get("content")
    )
    summary = (
        f"Faza {session.get('phase')}, target={session.get('target')}, "
        f"SUDs={session.get('suds')}, VOC={session.get('voc')}."
    )
    try:
        raw = llm.complete(
            [
                {
                    "role": "system",
                    "content": "Sažmi EMDR sesiju u 3–5 rečenica za memoriju osobe. Bez detalja traume. JSON {\"summary\":\"...\"}",
                },
                {"role": "user", "content": transcript[-6000:] or summary},
            ]
        )
        start, end = raw.find("{"), raw.rfind("}")
        if start >= 0 and end > start:
            data = json.loads(raw[start : end + 1])
            summary = data.get("summary") or summary
        elif raw.strip():
            summary = raw.strip()[:600]
    except (llm.LLMError, json.JSONDecodeError, ValueError):
        pass
    db.update_session(session_id, {"status": "closed", "phase": "closure", "summary": summary})
    db.append_person_memory(person["id"], summary)
    closing = (
        "Sesija je zatvorena. Processing može da se nastavi sinoć / sutra — zabeleži šta se pojavi. "
        "Ako ostane talas, Safe Place. Ne vozi odmah ako si iscrpljen."
    )
    event = db.add_event(session_id, "guide", "closure", closing, phase="closure")
    return {"session": db.get_session(session_id), "summary": summary, "event": event}
