from __future__ import annotations

import json
from typing import Any

import httpx

from .config import settings
from . import db


class LLMError(RuntimeError):
    pass


def _saved(key: str) -> str:
    return (db.get_setting(key) or "").strip()


def provider_config(provider: str | None = None) -> dict[str, str]:
    name = (provider or db.get_setting("provider") or settings.default_provider or "deepseek").lower()
    if name not in {"deepseek", "openai"}:
        name = "deepseek"
    if name == "openai":
        key = _saved("openai_api_key") or settings.openai_api_key
        base = (_saved("openai_base_url") or settings.openai_base_url).rstrip("/")
        if base.endswith("/v1"):
            pass
        else:
            base = f"{base}/v1"
        model = _saved("openai_model") or settings.openai_model
        return {"name": name, "api_key": key, "base_url": base, "model": model}
    key = _saved("deepseek_api_key") or settings.deepseek_api_key
    base = (_saved("deepseek_base_url") or settings.deepseek_base_url).rstrip("/")
    if not base.endswith("/v1"):
        base = f"{base}/v1"
    model = _saved("deepseek_model") or settings.deepseek_model
    return {"name": "deepseek", "api_key": key, "base_url": base, "model": model}


def public_ai_status() -> dict[str, Any]:
    deepseek = provider_config("deepseek")
    openai = provider_config("openai")
    active = provider_config(None)
    return {
        "provider": active["name"],
        "model": active["model"],
        "deepseek_ready": bool(deepseek["api_key"]),
        "openai_ready": bool(openai["api_key"]),
        "deepseek_model": deepseek["model"],
        "openai_model": openai["model"],
        "deepseek_base_url": deepseek["base_url"],
        "openai_base_url": openai["base_url"],
    }


def complete(messages: list[dict[str, str]], provider: str | None = None) -> str:
    cfg = provider_config(provider)
    if not cfg["api_key"]:
        raise LLMError(
            f"Nema API ključa za {cfg['name']}. Ubaci ga u Settings ili .env."
        )
    url = f"{cfg['base_url']}/chat/completions"
    payload = {
        "model": cfg["model"],
        "messages": messages,
        "temperature": 0.35,
        "max_tokens": 500,
    }
    headers = {
        "Authorization": f"Bearer {cfg['api_key']}",
        "Content-Type": "application/json",
    }
    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text[:400]
        raise LLMError(f"{cfg['name']} HTTP {exc.response.status_code}: {detail}") from exc
    except httpx.HTTPError as exc:
        raise LLMError(f"Mrežna greška ka {cfg['name']}: {exc}") from exc
    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise LLMError("Neočekivan odgovor modela.") from exc


def parse_agent_json(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        start = text.find("{")
        end = text.rfind("}")
        data = json.loads(text[start : end + 1] if start >= 0 else text)
    except json.JSONDecodeError:
        return {
            "say": raw.strip()[:600],
            "phase": "",
            "action": "wait",
            "set_seconds": 38,
            "updates": {},
        }
    updates = data.get("updates") or {}
    if not isinstance(updates, dict):
        updates = {}
    return {
        "say": str(data.get("say") or "").strip(),
        "phase": str(data.get("phase") or "").strip(),
        "action": str(data.get("action") or "wait").strip(),
        "set_seconds": int(data.get("set_seconds") or 38),
        "updates": updates,
        "raw": raw,
    }
