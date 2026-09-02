from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from .config import settings

DB_PATH = settings.data_dir / "emdr.db"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS people (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                presenting_issue TEXT DEFAULT '',
                strengths TEXT DEFAULT '',
                safe_place TEXT DEFAULT '',
                current_target TEXT DEFAULT '',
                negative_cognition TEXT DEFAULT '',
                positive_cognition TEXT DEFAULT '',
                last_suds INTEGER,
                last_voc INTEGER,
                notes TEXT DEFAULT '',
                memory_json TEXT DEFAULT '{}',
                preferences_json TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                person_id INTEGER NOT NULL,
                title TEXT DEFAULT '',
                phase TEXT DEFAULT 'preparation',
                status TEXT DEFAULT 'open',
                target TEXT DEFAULT '',
                negative_cognition TEXT DEFAULT '',
                positive_cognition TEXT DEFAULT '',
                suds INTEGER,
                voc INTEGER,
                summary TEXT DEFAULT '',
                settings_json TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                kind TEXT NOT NULL,
                phase TEXT DEFAULT '',
                content TEXT DEFAULT '',
                meta_json TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            """
        )


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    data = dict(row)
    for key in ("memory_json", "preferences_json", "settings_json", "meta_json"):
        if key in data and isinstance(data[key], str):
            try:
                data[key.replace("_json", "")] = json.loads(data[key] or "{}")
            except json.JSONDecodeError:
                data[key.replace("_json", "")] = {}
            del data[key]
    return data


def list_people() -> list[dict[str, Any]]:
    with connect() as db:
        rows = db.execute(
            "SELECT * FROM people ORDER BY updated_at DESC"
        ).fetchall()
    return [row_to_dict(r) for r in rows]


def create_person(name: str) -> dict[str, Any]:
    now = _now()
    with connect() as db:
        cur = db.execute(
            """
            INSERT INTO people (name, created_at, updated_at)
            VALUES (?, ?, ?)
            """,
            (name.strip(), now, now),
        )
        person_id = cur.lastrowid
    return get_person(person_id)


def get_person(person_id: int) -> dict[str, Any] | None:
    with connect() as db:
        row = db.execute("SELECT * FROM people WHERE id = ?", (person_id,)).fetchone()
    return row_to_dict(row)


def update_person(person_id: int, fields: dict[str, Any]) -> dict[str, Any] | None:
    allowed = {
        "name",
        "presenting_issue",
        "strengths",
        "safe_place",
        "current_target",
        "negative_cognition",
        "positive_cognition",
        "last_suds",
        "last_voc",
        "notes",
    }
    sets: list[str] = []
    values: list[Any] = []
    for key, value in fields.items():
        if key == "memory":
            sets.append("memory_json = ?")
            values.append(json.dumps(value, ensure_ascii=False))
        elif key == "preferences":
            sets.append("preferences_json = ?")
            values.append(json.dumps(value, ensure_ascii=False))
        elif key in allowed:
            sets.append(f"{key} = ?")
            values.append(value)
    if not sets:
        return get_person(person_id)
    sets.append("updated_at = ?")
    values.append(_now())
    values.append(person_id)
    with connect() as db:
        db.execute(f"UPDATE people SET {', '.join(sets)} WHERE id = ?", values)
    return get_person(person_id)


def delete_person(person_id: int) -> None:
    with connect() as db:
        db.execute("DELETE FROM people WHERE id = ?", (person_id,))


def list_sessions(person_id: int) -> list[dict[str, Any]]:
    with connect() as db:
        rows = db.execute(
            """
            SELECT * FROM sessions
            WHERE person_id = ?
            ORDER BY created_at DESC
            """,
            (person_id,),
        ).fetchall()
    return [row_to_dict(r) for r in rows]


def create_session(person_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    now = _now()
    person = get_person(person_id)
    if not person:
        raise ValueError("Person not found")
    title = payload.get("title") or f"Sesija {now[:10]}"
    with connect() as db:
        cur = db.execute(
            """
            INSERT INTO sessions (
                person_id, title, phase, status, target,
                negative_cognition, positive_cognition, suds, voc,
                settings_json, created_at, updated_at
            ) VALUES (?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                person_id,
                title,
                payload.get("phase") or "preparation",
                payload.get("target") or person.get("current_target") or "",
                payload.get("negative_cognition") or person.get("negative_cognition") or "",
                payload.get("positive_cognition") or person.get("positive_cognition") or "",
                payload.get("suds") if payload.get("suds") is not None else person.get("last_suds"),
                payload.get("voc") if payload.get("voc") is not None else person.get("last_voc"),
                json.dumps(payload.get("settings") or {}, ensure_ascii=False),
                now,
                now,
            ),
        )
        session_id = cur.lastrowid
    return get_session(session_id)


def get_session(session_id: int) -> dict[str, Any] | None:
    with connect() as db:
        row = db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
    return row_to_dict(row)


def update_session(session_id: int, fields: dict[str, Any]) -> dict[str, Any] | None:
    allowed = {
        "title",
        "phase",
        "status",
        "target",
        "negative_cognition",
        "positive_cognition",
        "suds",
        "voc",
        "summary",
    }
    sets: list[str] = []
    values: list[Any] = []
    for key, value in fields.items():
        if key == "settings":
            sets.append("settings_json = ?")
            values.append(json.dumps(value, ensure_ascii=False))
        elif key in allowed:
            sets.append(f"{key} = ?")
            values.append(value)
    if not sets:
        return get_session(session_id)
    sets.append("updated_at = ?")
    values.append(_now())
    values.append(session_id)
    with connect() as db:
        db.execute(f"UPDATE sessions SET {', '.join(sets)} WHERE id = ?", values)
    session = get_session(session_id)
    if session and any(k in fields for k in ("target", "negative_cognition", "positive_cognition", "suds", "voc")):
        person_fields: dict[str, Any] = {
            "current_target": session.get("target") or "",
            "negative_cognition": session.get("negative_cognition") or "",
            "positive_cognition": session.get("positive_cognition") or "",
        }
        if session.get("suds") is not None:
            person_fields["last_suds"] = session["suds"]
        if session.get("voc") is not None:
            person_fields["last_voc"] = session["voc"]
        update_person(session["person_id"], person_fields)
    return session


def add_event(
    session_id: int,
    role: str,
    kind: str,
    content: str,
    phase: str = "",
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    now = _now()
    with connect() as db:
        cur = db.execute(
            """
            INSERT INTO events (session_id, role, kind, phase, content, meta_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                role,
                kind,
                phase,
                content,
                json.dumps(meta or {}, ensure_ascii=False),
                now,
            ),
        )
        event_id = cur.lastrowid
        row = db.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        db.execute("UPDATE sessions SET updated_at = ? WHERE id = ?", (now, session_id))
        session = db.execute(
            "SELECT person_id FROM sessions WHERE id = ?", (session_id,)
        ).fetchone()
        if session:
            db.execute(
                "UPDATE people SET updated_at = ? WHERE id = ?",
                (now, session["person_id"]),
            )
    return row_to_dict(row)


def list_events(session_id: int, limit: int = 80) -> list[dict[str, Any]]:
    with connect() as db:
        rows = db.execute(
            """
            SELECT * FROM events
            WHERE session_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (session_id, limit),
        ).fetchall()
    return list(reversed([row_to_dict(r) for r in rows]))


def get_setting(key: str, default: str = "") -> str:
    with connect() as db:
        row = db.execute(
            "SELECT value FROM app_settings WHERE key = ?", (key,)
        ).fetchone()
    return row["value"] if row else default


def set_setting(key: str, value: str) -> None:
    with connect() as db:
        db.execute(
            """
            INSERT INTO app_settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (key, value),
        )


def append_person_memory(person_id: int, summary: str) -> None:
    person = get_person(person_id)
    if not person:
        return
    memory = person.get("memory") or {}
    history = list(memory.get("session_summaries") or [])
    history.append({"at": _now(), "summary": summary})
    memory["session_summaries"] = history[-24:]
    update_person(person_id, {"memory": memory})
