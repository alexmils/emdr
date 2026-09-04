import { NextResponse } from "next/server";
import {
  addMessage,
  getEnabledMemoryContext,
  getThread,
  listMessages,
  updateThread,
} from "@/lib/db";
import { chatCompletion } from "@/lib/llm";
import { checkInLine, guidedFallbackReply, openingLine, systemPromptForPhase } from "@/lib/protocol";
import {
  getLlmRuntimeConfig,
  getPlatformSettings,
} from "@/lib/platform-settings";
import {
  extractJsonObject,
  interpretationContextBlock,
  interpreterSystemPrompt,
  parseSessionInterpretation,
  threadPatchFromInterpretation,
  type SessionInterpretation,
} from "@/lib/session-interpreter";
import { withAuth } from "@/lib/api-auth";

async function runInterpreter(opts: {
  settings: Awaited<ReturnType<typeof getLlmRuntimeConfig>>;
  phase: string;
  threadSummary: string;
  recentMessages: { role: string; content: string }[];
  userMessage: string;
}): Promise<SessionInterpretation | null> {
  try {
    const raw = await chatCompletion(opts.settings, [
      {
        role: "system",
        content: interpreterSystemPrompt(
          opts.phase as Parameters<typeof interpreterSystemPrompt>[0]
        ),
      },
      {
        role: "user",
        content: [
          `Thread state:\n${opts.threadSummary}`,
          "",
          "Recent messages:",
          ...opts.recentMessages.map(
            (m) => `${m.role === "agent" ? "assistant" : "user"}: ${m.content}`
          ),
          "",
          `Latest user message: ${opts.userMessage}`,
        ].join("\n"),
      },
    ]);
    return parseSessionInterpretation(extractJsonObject(raw));
  } catch (err) {
    console.warn("[chat] interpreter failed:", err);
    return null;
  }
}

export async function POST(request: Request) {
  return withAuth(async () => {
    const body = await request.json();
    const { threadId, userMessage, bootstrap, afterSet } = body as {
      threadId: string;
      userMessage?: string;
      bootstrap?: boolean;
      afterSet?: boolean;
    };

    const thread = await getThread(threadId);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    if (thread.mode !== "guided") {
      return NextResponse.json(
        { error: "Chat is only available in guided sessions" },
        { status: 400 }
      );
    }

    const settings = await getLlmRuntimeConfig();
    const platform = await getPlatformSettings();
    const memoryContext = await getEnabledMemoryContext(threadId);
    const history = await listMessages(threadId);

    if (bootstrap && history.length === 0) {
      const line = openingLine(thread.phase);
      const msg = await addMessage(threadId, "agent", line);
      return NextResponse.json({ message: msg });
    }

    if (afterSet) {
      const line = checkInLine(thread.phase);
      const msg = await addMessage(threadId, "agent", line);
      return NextResponse.json({ message: msg });
    }

    if (userMessage) {
      await addMessage(threadId, "user", userMessage);
    }

    let interpretation: SessionInterpretation | null = null;
    let workingThread = thread;

    if (
      userMessage &&
      platform.flags.sessionInterpreter !== false
    ) {
      const recent = (await listMessages(threadId)).slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      interpretation = await runInterpreter({
        settings,
        phase: thread.phase,
        threadSummary: [
          `phase=${thread.phase}`,
          `target=${thread.target ?? ""}`,
          `NC=${thread.negativeCognition ?? ""}`,
          `PC=${thread.positiveCognition ?? ""}`,
          `suds=${thread.suds ?? ""}`,
          `voc=${thread.voc ?? ""}`,
        ].join("\n"),
        recentMessages: recent,
        userMessage,
      });

      if (interpretation) {
        const patch = threadPatchFromInterpretation(thread, interpretation);
        if (Object.keys(patch).length > 0) {
          const updated = await updateThread(threadId, patch);
          if (updated) workingThread = updated;
        }
      }
    } else if (userMessage) {
      // Legacy regex fallbacks when interpreter is disabled
      if (thread.phase === "grounding" && userMessage.length > 2) {
        const updated = await updateThread(threadId, { phase: "assessment" });
        if (updated) workingThread = updated;
      }
      if (thread.phase === "assessment") {
        const sudsMatch = userMessage.match(/\b(\d{1,2})\b/);
        if (sudsMatch) {
          const suds = parseInt(sudsMatch[1], 10);
          if (suds >= 0 && suds <= 10) {
            const updated = await updateThread(threadId, {
              suds,
              phase: "desensitization",
            });
            if (updated) workingThread = updated;
          }
        }
      }
      if (thread.phase === "desensitization") {
        const sudsMatch = userMessage.match(/\b(\d{1,2})\b/);
        if (sudsMatch) {
          const suds = parseInt(sudsMatch[1], 10);
          if (suds >= 0 && suds <= 1) {
            const updated = await updateThread(threadId, {
              suds,
              phase: "installation",
            });
            if (updated) workingThread = updated;
          } else if (suds >= 0 && suds <= 10) {
            const updated = await updateThread(threadId, { suds });
            if (updated) workingThread = updated;
          }
        }
      }
    }

    const adminNotes = platform.agentKnowledgeNotes?.trim();
    const system =
      systemPromptForPhase(workingThread.phase, memoryContext) +
      (adminNotes
        ? `\n\nAdmin protocol notes (platform):\n${adminNotes.slice(0, 4000)}`
        : "") +
      (interpretation
        ? `\n\n${interpretationContextBlock(interpretation)}`
        : "");

    const messages = [
      {
        role: "system" as const,
        content: system,
      },
      ...(await listMessages(threadId))
        .filter((m) => !isStaleFallbackMessage(m.content))
        .map((m) => ({
          role: (m.role === "agent" ? "assistant" : "user") as
            | "assistant"
            | "user",
          content: m.content,
        })),
    ];

    try {
      const reply = await chatCompletion(settings, messages);
      const text = reply.trim();
      if (!text) {
        throw new Error("Empty LLM reply");
      }
      const agentMsg = await addMessage(threadId, "agent", text);
      const fresh = await getThread(threadId);

      return NextResponse.json({
        message: agentMsg,
        thread: fresh,
        interpretation: interpretation
          ? {
              suds: interpretation.suds,
              voc: interpretation.voc,
              suggestedPhase: interpretation.suggestedPhase,
              distress: interpretation.distress,
              needsGrounding: interpretation.needsGrounding,
            }
          : null,
      });
    } catch (e) {
      console.warn("[chat] LLM failed:", e);
      const fallback = interpretation?.needsGrounding
        ? "Let's pause and ground. Cross your arms for a butterfly hug, or picture your safe place. When you feel steadier, tell me what you notice."
        : guidedFallbackReply(workingThread.phase, userMessage);
      const agentMsg = await addMessage(threadId, "agent", fallback);
      return NextResponse.json({
        message: agentMsg,
        thread: await getThread(threadId),
        interpretation: interpretation
          ? {
              suds: interpretation.suds,
              voc: interpretation.voc,
              suggestedPhase: interpretation.suggestedPhase,
              distress: interpretation.distress,
              needsGrounding: interpretation.needsGrounding,
            }
          : null,
        warning: e instanceof Error ? e.message : "LLM error",
      });
    }
  });
}

/** Old generic LLM-failure lines that should not poison the guide context. */
function isStaleFallbackMessage(content: string): boolean {
  const t = content.trim();
  return (
    t.startsWith("I'm here with you. Take a breath.") ||
    t.includes("Configure an AI provider in Settings")
  );
}
