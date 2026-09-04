"use client";

import { useEffect, useState } from "react";
import type { EmailTemplateId } from "@/lib/email/templates";
import { fetchJson } from "@/lib/fetch-json";

export function TemplateEditor({
  template,
  onSaved,
}: {
  template: {
    id: EmailTemplateId;
    subject: string;
    html: string;
    text: string;
    isCustom: boolean;
  };
  onSaved: () => void;
}) {
  const [subject, setSubject] = useState(template.subject);
  const [html, setHtml] = useState(template.html);
  const [text, setText] = useState(template.text);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setSubject(template.subject);
    setHtml(template.html);
    setText(template.text);
  }, [template]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await fetchJson(`/api/admin/email/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html,
          text: text || html.replace(/<[^>]+>/g, " "),
        }),
      });
      onSaved();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-template-editor" onSubmit={(e) => void save(e)}>
      <label className="admin-field-label">
        Subject
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="field"
        />
      </label>
      <label className="admin-field-label">
        HTML body
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          className="field admin-textarea"
          rows={8}
        />
      </label>
      <label className="admin-field-label">
        Plain text (optional)
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="field admin-textarea"
          rows={3}
        />
      </label>
      <button type="submit" disabled={busy} className="btn-primary w-fit">
        {busy ? "Saving…" : template.isCustom ? "Update template" : "Save custom version"}
      </button>
      {err && <p className="admin-invite-msg">{err}</p>}
    </form>
  );
}

export function BroadcastForm({ onSent }: { onSent: (sent: number) => void }) {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetchJson<{ sent: number }>("/api/admin/email/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html,
          text: text || html.replace(/<[^>]+>/g, " "),
        }),
      });
      setSubject("");
      setHtml("");
      setText("");
      onSent(res.sent ?? 0);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Broadcast failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-form-stack mt-3" onSubmit={(e) => void submit(e)}>
      <input
        type="text"
        required
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="field"
      />
      <textarea
        required
        placeholder="HTML body"
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        className="field admin-textarea"
        rows={5}
      />
      <textarea
        placeholder="Plain text (optional)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="field admin-textarea"
        rows={3}
      />
      <button type="submit" disabled={busy} className="btn-primary w-fit">
        {busy ? "Sending…" : "Send broadcast"}
      </button>
      {err && <p className="admin-invite-msg">{err}</p>}
    </form>
  );
}
